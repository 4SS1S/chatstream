using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using System.Security.Claims;
using ChatStreamAPI.Services;

namespace ChatStreamAPI.Hubs
{
    public class ChatHub : Hub
    {
        private readonly IChatService _chatService;
        private readonly IStreamService _streamService;

        public ChatHub(IChatService chatService, IStreamService streamService)
        {
            _chatService = chatService;
            _streamService = streamService;
        }

        public async Task JoinRoom(string roomName)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, roomName);
            
            var userName = GetUserName();
            await Clients.Group(roomName).SendAsync("UserJoined", userName, roomName);
            
            // Enviar histórico de mensagens
            var messages = await _chatService.GetRoomMessagesAsync(roomName, 50);
            await Clients.Caller.SendAsync("MessageHistory", messages);
        }

        public async Task LeaveRoom(string roomName)
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, roomName);
            
            var userName = GetUserName();
            await Clients.Group(roomName).SendAsync("UserLeft", userName, roomName);
        }

        public async Task SendMessage(string roomName, string message)
        {
            var userId = GetUserId();
            var userName = GetUserName();
            var isGuest = IsGuest();

            var chatMessage = await _chatService.SaveMessageAsync(roomName, userId, userName, message, isGuest);
            
            await Clients.Group(roomName).SendAsync("ReceiveMessage", new
            {
                Id = chatMessage.Id,
                Content = chatMessage.Content,
                SenderName = userName,
                SenderId = userId,
                SentAt = chatMessage.SentAt,
                IsGuest = isGuest
            });
        }

        public async Task StartStream(string title, string description)
        {
            var userId = GetUserId();
            var userName = GetUserName();

            if (IsGuest())
            {
                await Clients.Caller.SendAsync("Error", "Guests cannot start streams");
                return;
            }

            var stream = await _streamService.StartStreamAsync(userId, title, description);
            
            await Clients.All.SendAsync("StreamStarted", new
            {
                Id = stream.Id,
                Title = stream.Title,
                StreamerName = userName,
                StreamKey = stream.StreamKey
            });
        }

        public async Task EndStream(int streamId)
        {
            var userId = GetUserId();
            
            if (IsGuest())
            {
                await Clients.Caller.SendAsync("Error", "Unauthorized");
                return;
            }

            await _streamService.EndStreamAsync(streamId, userId);
            await Clients.All.SendAsync("StreamEnded", streamId);
        }

        public async Task JoinStreamViewer(int streamId)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, $"stream_{streamId}");
            await _streamService.IncrementViewerAsync(streamId);
            
            var viewerCount = await _streamService.GetViewerCountAsync(streamId);
            await Clients.Group($"stream_{streamId}").SendAsync("ViewerCountUpdated", streamId, viewerCount);
        }

        public async Task LeaveStreamViewer(int streamId)
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"stream_{streamId}");
            await _streamService.DecrementViewerAsync(streamId);
            
            var viewerCount = await _streamService.GetViewerCountAsync(streamId);
            await Clients.Group($"stream_{streamId}").SendAsync("ViewerCountUpdated", streamId, viewerCount);
        }

        public async Task SendStreamChat(int streamId, string message)
        {
            var userId = GetUserId();
            var userName = GetUserName();
            
            await Clients.Group($"stream_{streamId}").SendAsync("StreamChatMessage", new
            {
                StreamId = streamId,
                Content = message,
                SenderName = userName,
                SenderId = userId,
                SentAt = DateTime.UtcNow,
                IsGuest = IsGuest()
            });
        }

        // WebRTC Signaling for video streaming
        public async Task SendOffer(string streamId, object offer)
        {
            await Clients.Group($"stream_{streamId}").SendAsync("ReceiveOffer", Context.ConnectionId, offer);
        }

        public async Task SendAnswer(string connectionId, object answer)
        {
            await Clients.Client(connectionId).SendAsync("ReceiveAnswer", Context.ConnectionId, answer);
        }

        public async Task SendIceCandidate(string target, object candidate)
        {
            if (target == "broadcast")
            {
                await Clients.Others.SendAsync("ReceiveIceCandidate", Context.ConnectionId, candidate);
            }
            else
            {
                await Clients.Client(target).SendAsync("ReceiveIceCandidate", Context.ConnectionId, candidate);
            }
        }

        public override async Task OnConnectedAsync()
        {
            var userName = GetUserName();
            await Clients.All.SendAsync("UserConnected", userName);
            await base.OnConnectedAsync();
        }

        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            var userName = GetUserName();
            await Clients.All.SendAsync("UserDisconnected", userName);
            await base.OnDisconnectedAsync(exception);
        }

        private string GetUserId()
        {
            return Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "anonymous";
        }

        private string GetUserName()
        {
            return Context.User?.FindFirst(ClaimTypes.Name)?.Value ?? "Anonymous";
        }

        private bool IsGuest()
        {
            var isGuestClaim = Context.User?.FindFirst("isGuest")?.Value;
            return bool.TryParse(isGuestClaim, out var isGuest) && isGuest;
        }
    }
}