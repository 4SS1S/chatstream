using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ChatStreamAPI.Services;
using System.Security.Claims;

namespace ChatStreamAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class StreamController : ControllerBase
    {
        private readonly IStreamService _streamService;

        public StreamController(IStreamService streamService)
        {
            _streamService = streamService;
        }

        [HttpGet("active")]
        public async Task<IActionResult> GetActiveStreams()
        {
            var streams = await _streamService.GetActiveStreamsAsync();
            
            var result = streams.Select(s => new
            {
                Id = s.Id,
                Title = s.Title,
                Description = s.Description,
                StreamerName = s.Streamer.DisplayName ?? s.Streamer.UserName,
                StartedAt = s.StartedAt,
                ViewerCount = _streamService.GetViewerCountAsync(s.Id).Result
            });

            return Ok(result);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetStream(int id)
        {
            var stream = await _streamService.GetStreamAsync(id);
            if (stream == null)
            {
                return NotFound();
            }

            var result = new
            {
                Id = stream.Id,
                Title = stream.Title,
                Description = stream.Description,
                StreamerName = stream.Streamer.DisplayName ?? stream.Streamer.UserName,
                StreamerId = stream.StreamerId,
                Status = stream.Status.ToString(),
                StartedAt = stream.StartedAt,
                ViewerCount = await _streamService.GetViewerCountAsync(stream.Id)
            };

            return Ok(result);
        }

        [HttpPost]
        [Authorize]
        public async Task<IActionResult> StartStream([FromBody] StartStreamRequest request)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var isGuest = User.FindFirst("isGuest")?.Value == "true";

            if (string.IsNullOrEmpty(userId) || isGuest)
            {
                return Unauthorized("Guests cannot start streams");
            }

            try
            {
                var stream = await _streamService.StartStreamAsync(userId, request.Title, request.Description);
                
                return Ok(new
                {
                    Id = stream.Id,
                    Title = stream.Title,
                    Description = stream.Description,
                    StreamKey = stream.StreamKey,
                    Status = stream.Status.ToString()
                });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPost("{id}/end")]
        [Authorize]
        public async Task<IActionResult> EndStream(int id)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var isGuest = User.FindFirst("isGuest")?.Value == "true";

            if (string.IsNullOrEmpty(userId) || isGuest)
            {
                return Unauthorized();
            }

            var result = await _streamService.EndStreamAsync(id, userId);
            if (!result)
            {
                return NotFound("Stream not found or unauthorized");
            }

            return Ok(new { message = "Stream ended successfully" });
        }

        [HttpPost("validate-key")]
        public async Task<IActionResult> ValidateStreamKey([FromBody] ValidateKeyRequest request)
        {
            var isValid = await _streamService.ValidateStreamKeyAsync(request.StreamKey);
            return Ok(new { isValid });
        }

        [HttpGet("{id}/viewer-count")]
        public async Task<IActionResult> GetViewerCount(int id)
        {
            var count = await _streamService.GetViewerCountAsync(id);
            return Ok(new { viewerCount = count });
        }
    }

    public class StartStreamRequest
    {
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
    }

    public class ValidateKeyRequest
    {
        public string StreamKey { get; set; } = string.Empty;
    }
}