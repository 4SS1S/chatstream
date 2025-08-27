using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using ChatStreamAPI.Models;

namespace ChatStreamAPI.Data
{
    public class ApplicationDbContext : IdentityDbContext<User>
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
            : base(options)
        {
        }

        public DbSet<ChatRoom> ChatRooms { get; set; }
        public DbSet<ChatMessage> ChatMessages { get; set; }
        public DbSet<ChatRoomMember> ChatRoomMembers { get; set; }
        public DbSet<StreamSession> StreamSessions { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // User configurations
            modelBuilder.Entity<User>(entity =>
            {
                entity.Property(e => e.DisplayName).HasMaxLength(100);
                entity.Property(e => e.AvatarUrl).HasMaxLength(500);
            });

            // ChatRoom configurations
            modelBuilder.Entity<ChatRoom>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Name).IsRequired().HasMaxLength(100);
                entity.Property(e => e.Description).HasMaxLength(500);
                
                entity.HasOne(e => e.CreatedBy)
                    .WithMany()
                    .HasForeignKey(e => e.CreatedById)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            // ChatMessage configurations
            modelBuilder.Entity<ChatMessage>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Content).IsRequired().HasMaxLength(2000);
                
                entity.HasOne(e => e.Sender)
                    .WithMany(u => u.SentMessages)
                    .HasForeignKey(e => e.SenderId)
                    .OnDelete(DeleteBehavior.Restrict);
                
                entity.HasOne(e => e.ChatRoom)
                    .WithMany(r => r.Messages)
                    .HasForeignKey(e => e.ChatRoomId)
                    .OnDelete(DeleteBehavior.Cascade);
                
                entity.HasIndex(e => e.SentAt);
            });

            // ChatRoomMember configurations
            modelBuilder.Entity<ChatRoomMember>(entity =>
            {
                entity.HasKey(e => e.Id);
                
                entity.HasOne(e => e.User)
                    .WithMany(u => u.RoomMemberships)
                    .HasForeignKey(e => e.UserId)
                    .OnDelete(DeleteBehavior.Cascade);
                
                entity.HasOne(e => e.ChatRoom)
                    .WithMany(r => r.Members)
                    .HasForeignKey(e => e.ChatRoomId)
                    .OnDelete(DeleteBehavior.Cascade);
                
                entity.HasIndex(e => new { e.UserId, e.ChatRoomId }).IsUnique();
            });

            // StreamSession configurations
            modelBuilder.Entity<StreamSession>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Title).IsRequired().HasMaxLength(200);
                entity.Property(e => e.Description).HasMaxLength(1000);
                entity.Property(e => e.StreamKey).IsRequired().HasMaxLength(100);
                
                entity.HasOne(e => e.Streamer)
                    .WithMany(u => u.StreamSessions)
                    .HasForeignKey(e => e.StreamerId)
                    .OnDelete(DeleteBehavior.Cascade);
                
                entity.HasIndex(e => e.StreamKey).IsUnique();
                entity.HasIndex(e => e.Status);
            });

            // Seed data
            modelBuilder.Entity<ChatRoom>().HasData(
                new ChatRoom 
                { 
                    Id = 1, 
                    Name = "General", 
                    Description = "General discussion room", 
                    IsPrivate = false,
                    CreatedById = "system",
                    CreatedAt = DateTime.UtcNow
                }
            );
        }
    }
}