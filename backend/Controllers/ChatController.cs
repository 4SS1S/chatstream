using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ChatStreamAPI.Services;
using System.Security.Claims;

namespace ChatStreamAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ChatController : ControllerBase
    {
        private readonly IChatService _chatService;

        public ChatController(IChatService chatService)
        {
            _chatService = chatService;
        }

        [HttpGet("rooms/{roomName}/messages")]
        public async Task<IActionResult> GetRoomMessages(string roomName, [FromQuery] int count = 50)
        {
            var messages = await _chatService.GetRoomMessagesAsync(roomName, count);
            return Ok(messages);
        }

        [HttpGet("rooms")]
        [Authorize]
        public async Task<IActionResult> GetUserRooms()
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var isGuest = User.FindFirst("isGuest")?.Value == "true";

            if (string.IsNullOrEmpty(userId) || isGuest)
            {
                // Para guests, retornar salas públicas padrão
                return Ok(new[]
                {
                    new { Id = 1, Name = "General", Description = "General discussion room" }
                });
            }

            var rooms = await _chatService.GetUserRoomsAsync(userId);
            
            var result = rooms.Select(r => new
            {
                Id = r.Id,
                Name = r.Name,
                Description = r.Description,
                IsPrivate = r.IsPrivate,
                CreatedAt = r.CreatedAt
            });

            return Ok(result);
        }

        [HttpPost("rooms")]
        [Authorize]
        public async Task<IActionResult> CreateRoom([FromBody] CreateRoomRequest request)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var isGuest = User.FindFirst("isGuest")?.Value == "true";

            if (string.IsNullOrEmpty(userId) || isGuest)
            {
                return Unauthorized("Guests cannot create rooms");
            }

            try
            {
                var room = await _chatService.GetOrCreateRoomAsync(request.Name);
                
                return Ok(new
                {
                    Id = room.Id,
                    Name = room.Name,
                    Description = room.Description,
                    IsPrivate = room.IsPrivate
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
    }

    public class CreateRoomRequest
    {
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public bool IsPrivate { get; set; } = false;
    }
}