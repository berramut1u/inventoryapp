public class InventoryMoveDto
{
    public int Amount { get; set; }
    public string Direction { get; set; } = string.Empty;
    public string? Reason { get; set; }
}
