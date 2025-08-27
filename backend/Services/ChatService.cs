using Microsoft.EntityFrameworkCore;
using ChatStreamAPI.Data;
using ChatStreamAPI.Models;

namespace ChatStreamAPI.Services
{
    public interface IChatService
    {
        Task<ChatMessage> SaveMessageAsync(string roomName, string userId, string userName, string content, bool isGuest);
        Task<List<object>> GetRoomMessagesAsync(string roomName, int count = 50);
        Task<ChatRoom> GetOrCreateRoomAsync(string roomName);
        Task<List<ChatRoom>> GetUserRoomsAsync(string userId);
    }

    public class ChatService : IChatService
    {
        private readonly ApplicationDbContext _context;

        public ChatService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<ChatMessage> SaveMessageAsync(string roomName, string userId, string userName, string content, bool isGuest)
        {
            var room = await GetOrCreateRoomAsync(roomName);
            
            var message = new ChatMessage
            {
                Content = content,
                SenderId = userId,
                ChatRoomId = room.Id,
                SentAt = DateTime.UtcNow,
                Type = MessageType.Text
            };

            _context.ChatMessages.Add(message);
            await _context.SaveChangesAsync();

            // Se não é um guest e o usuário existe, adicionar à sala se não for membro
            if (!isGuest)
            {
                var user = await _context.Users.FindAsync(userId);
                if (user != null)
                {
                    var membership = await _context.ChatRoomMembers
                        .FirstOrDefaultAsync(m => m.UserId == userId && m.ChatRoomId == room.Id);
                    
                    if (membership == null)
                    {
                        var member = new ChatRoomMember
                        {
                            UserId = userId,
                            ChatRoomId = room.Id,
                            JoinedAt = DateTime.UtcNow,
                            Role = MemberRole.Member
                        };
                        
                        _context.ChatRoomMembers.Add(member);
                        await _context.SaveChangesAsync();
                    }
                }
            }

            return message;
        }

        public async Task<List<object>> GetRoomMessagesAsync(string roomName, int count = 50)
        {
            var room = await _context.ChatRooms
                .FirstOrDefaultAsync(r => r.Name.ToLower() == roomName.ToLower());

            if (room == null)
            {
                return new List<object>();
            }

            var messages = await _context.ChatMessages
                .Where(m => m.ChatRoomId == room.Id)
                .OrderByDescending(m => m.SentAt)
                .Take(count)
                .Select(m => new
                {
                    Id = m.Id,
                    Content = m.Content,
                    SenderName = m.Sender.DisplayName ?? m.Sender.UserName ?? "Guest",
                    SenderId = m.SenderId,
                    SentAt = m.SentAt,
                    Type = m.Type.ToString(),
                    IsGuest = !_context.Users.Any(u => u.Id == m.SenderId)
                })
                .ToListAsync();

            return messages.Cast<object>().Reverse().ToList();
        }

        public async Task<ChatRoom> GetOrCreateRoomAsync(string roomName)
        {
            var room = await _context.ChatRooms
                .FirstOrDefaultAsync(r => r.Name.ToLower() == roomName.ToLower());

            if (room == null)
            {
                room = new ChatRoom
                {
                    Name = roomName,
                    Description = $"Auto-created room: {roomName}",
                    IsPrivate = false,
                    CreatedAt = DateTime.UtcNow,
                    CreatedById = "system"
                };

                _context.ChatRooms.Add(room);
                await _context.SaveChangesAsync();
            }

            return room;
        }

        public async Task<List<ChatRoom>> GetUserRoomsAsync(string userId)
        {
            return await _context.ChatRoomMembers
                .Where(m => m.UserId == userId)
                .Select(m => m.ChatRoom)
                .ToListAsync();
        }
    }
}