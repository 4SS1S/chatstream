using Microsoft.AspNetCore.Identity;

namespace ChatStreamAPI.Models
{
    public class User : IdentityUser
    {
        public string? DisplayName { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime LastSeen { get; set; } = DateTime.UtcNow;
        public bool IsOnline { get; set; } = false;
        public string? AvatarUrl { get; set; }
        
        // Navigation properties
        public virtual ICollection<ChatMessage> SentMessages { get; set; } = new List<ChatMessage>();
        public virtual ICollection<ChatRoomMember> RoomMemberships { get; set; } = new List<ChatRoomMember>();
        public virtual ICollection<StreamSession> StreamSessions { get; set; } = new List<StreamSession>();
    }

    public class ChatRoom
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public bool IsPrivate { get; set; } = false;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public string CreatedById { get; set; } = string.Empty;
        
        // Navigation properties
        public virtual User CreatedBy { get; set; } = null!;
        public virtual ICollection<ChatMessage> Messages { get; set; } = new List<ChatMessage>();
        public virtual ICollection<ChatRoomMember> Members { get; set; } = new List<ChatRoomMember>();
    }

    public class ChatMessage
    {
        public int Id { get; set; }
        public string Content { get; set; } = string.Empty;
        public DateTime SentAt { get; set; } = DateTime.UtcNow;
        public string SenderId { get; set; } = string.Empty;
        public int ChatRoomId { get; set; }
        public MessageType Type { get; set; } = MessageType.Text;
        
        // Navigation properties
        public virtual User Sender { get; set; } = null!;
        public virtual ChatRoom ChatRoom { get; set; } = null!;
    }

    public class ChatRoomMember
    {
        public int Id { get; set; }
        public string UserId { get; set; } = string.Empty;
        public int ChatRoomId { get; set; }
        public DateTime JoinedAt { get; set; } = DateTime.UtcNow;
        public MemberRole Role { get; set; } = MemberRole.Member;
        
        // Navigation properties
        public virtual User User { get; set; } = null!;
        public virtual ChatRoom ChatRoom { get; set; } = null!;
    }

    public class StreamSession
    {
        public int Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string StreamerId { get; set; } = string.Empty;
        public string StreamKey { get; set; } = string.Empty;
        public StreamStatus Status { get; set; } = StreamStatus.Offline;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? StartedAt { get; set; }
        public DateTime? EndedAt { get; set; }
        public int ViewerCount { get; set; } = 0;
        
        // Navigation properties
        public virtual User Streamer { get; set; } = null!;
    }

    public enum MessageType
    {
        Text,
        Image,
        File,
        System
    }

    public enum MemberRole
    {
        Member,
        Moderator,
        Admin
    }

    public enum StreamStatus
    {
        Offline,
        Starting,
        Live,
        Paused,
        Ended
    }
}