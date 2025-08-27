using Microsoft.EntityFrameworkCore;
using ChatStreamAPI.Data;
using ChatStreamAPI.Models;

namespace ChatStreamAPI.Services
{
    public interface IStreamService
    {
        Task<StreamSession> StartStreamAsync(string streamerId, string title, string description);
        Task<bool> EndStreamAsync(int streamId, string streamerId);
        Task<List<StreamSession>> GetActiveStreamsAsync();
        Task<StreamSession?> GetStreamAsync(int streamId);
        Task<int> IncrementViewerAsync(int streamId);
        Task<int> DecrementViewerAsync(int streamId);
        Task<int> GetViewerCountAsync(int streamId);
        Task<bool> ValidateStreamKeyAsync(string streamKey);
    }

    public class StreamService : IStreamService
    {
        private readonly ApplicationDbContext _context;
        private readonly Dictionary<int, int> _viewerCounts;

        public StreamService(ApplicationDbContext context)
        {
            _context = context;
            _viewerCounts = new Dictionary<int, int>();
        }

        public async Task<StreamSession> StartStreamAsync(string streamerId, string title, string description)
        {
            // Verificar se o usuário já tem uma stream ativa
            var activeStream = await _context.StreamSessions
                .FirstOrDefaultAsync(s => s.StreamerId == streamerId && s.Status == StreamStatus.Live);

            if (activeStream != null)
            {
                throw new InvalidOperationException("User already has an active stream");
            }

            var streamKey = GenerateStreamKey();
            
            var stream = new StreamSession
            {
                Title = title,
                Description = description,
                StreamerId = streamerId,
                StreamKey = streamKey,
                Status = StreamStatus.Starting,
                CreatedAt = DateTime.UtcNow,
                StartedAt = DateTime.UtcNow
            };

            _context.StreamSessions.Add(stream);
            await _context.SaveChangesAsync();

            // Atualizar status para Live
            stream.Status = StreamStatus.Live;
            await _context.SaveChangesAsync();

            _viewerCounts[stream.Id] = 0;

            return stream;
        }

        public async Task<bool> EndStreamAsync(int streamId, string streamerId)
        {
            var stream = await _context.StreamSessions
                .FirstOrDefaultAsync(s => s.Id == streamId && s.StreamerId == streamerId);

            if (stream == null)
            {
                return false;
            }

            stream.Status = StreamStatus.Ended;
            stream.EndedAt = DateTime.UtcNow;
            
            await _context.SaveChangesAsync();

            _viewerCounts.Remove(streamId);

            return true;
        }

        public async Task<List<StreamSession>> GetActiveStreamsAsync()
        {
            return await _context.StreamSessions
                .Include(s => s.Streamer)
                .Where(s => s.Status == StreamStatus.Live)
                .OrderByDescending(s => s.StartedAt)
                .ToListAsync();
        }

        public async Task<StreamSession?> GetStreamAsync(int streamId)
        {
            return await _context.StreamSessions
                .Include(s => s.Streamer)
                .FirstOrDefaultAsync(s => s.Id == streamId);
        }

        public async Task<int> IncrementViewerAsync(int streamId)
        {
            lock (_viewerCounts)
            {
                if (!_viewerCounts.ContainsKey(streamId))
                {
                    _viewerCounts[streamId] = 0;
                }
                _viewerCounts[streamId]++;
                return _viewerCounts[streamId];
            }
        }

        public async Task<int> DecrementViewerAsync(int streamId)
        {
            lock (_viewerCounts)
            {
                if (_viewerCounts.ContainsKey(streamId))
                {
                    _viewerCounts[streamId] = Math.Max(0, _viewerCounts[streamId] - 1);
                    return _viewerCounts[streamId];
                }
                return 0;
            }
        }

        public async Task<int> GetViewerCountAsync(int streamId)
        {
            lock (_viewerCounts)
            {
                return _viewerCounts.TryGetValue(streamId, out var count) ? count : 0;
            }
        }

        public async Task<bool> ValidateStreamKeyAsync(string streamKey)
        {
            return await _context.StreamSessions
                .AnyAsync(s => s.StreamKey == streamKey && s.Status == StreamStatus.Live);
        }

        private string GenerateStreamKey()
        {
            return Guid.NewGuid().ToString("N")[..16].ToUpper();
        }
    }
}