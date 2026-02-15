using Microsoft.EntityFrameworkCore;
using BackendAPI.Models;

namespace BackendAPI.Data
{
    /// <summary>
    /// Контекст бази даних
    /// </summary>
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
            : base(options)
        {
        }

        public DbSet<User> Users { get; set; }
        public DbSet<Conversation> Conversations { get; set; }
        public DbSet<Message> Messages { get; set; }
        public DbSet<ConversationParticipant> ConversationParticipants { get; set; }
        public DbSet<MessageReadStatus> MessageReadStatuses { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Налаштування моделі User
            modelBuilder.Entity<User>(entity =>
            {
                // Унікальний індекс для email
                entity.HasIndex(e => e.Email)
                    .IsUnique()
                    .HasDatabaseName("IX_Users_Email");

                // Індекс для телефону
                entity.HasIndex(e => e.Phone)
                    .HasDatabaseName("IX_Users_Phone");

                // Налаштування обов'язкових полів
                entity.Property(e => e.FirstName)
                    .IsRequired()
                    .HasMaxLength(100);

                entity.Property(e => e.LastName)
                    .IsRequired()
                    .HasMaxLength(100);

                entity.Property(e => e.Email)
                    .IsRequired()
                    .HasMaxLength(255);

                entity.Property(e => e.PasswordHash)
                    .IsRequired();

                entity.Property(e => e.Phone)
                    .IsRequired()
                    .HasMaxLength(20);

                entity.Property(e => e.ProfilePhotoPath)
                    .HasMaxLength(500);

                entity.Property(e => e.IsActive)
                    .HasDefaultValue(true);
            });

            // Налаштування моделі Conversation
            modelBuilder.Entity<Conversation>(entity =>
            {
                entity.HasIndex(e => e.CreatedById);
                entity.HasIndex(e => e.LastMessageAt);

                entity.HasOne(c => c.CreatedBy)
                    .WithMany(u => u.CreatedConversations)
                    .HasForeignKey(c => c.CreatedById)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.Property(c => c.Name)
                    .HasMaxLength(200);
            });

            // Налаштування моделі ConversationParticipant
            modelBuilder.Entity<ConversationParticipant>(entity =>
            {
                entity.HasIndex(e => new { e.ConversationId, e.UserId })
                    .IsUnique()
                    .HasDatabaseName("IX_ConversationParticipant_ConversationId_UserId");

                entity.HasIndex(e => e.UserId);

                entity.HasOne(cp => cp.Conversation)
                    .WithMany(c => c.Participants)
                    .HasForeignKey(cp => cp.ConversationId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(cp => cp.User)
                    .WithMany(u => u.ConversationParticipants)
                    .HasForeignKey(cp => cp.UserId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.Property(cp => cp.Role)
                    .HasMaxLength(20)
                    .HasDefaultValue("member");

                entity.Property(cp => cp.IsActive)
                    .HasDefaultValue(true);
            });

            // Налаштування моделі Message
            modelBuilder.Entity<Message>(entity =>
            {
                entity.HasIndex(e => e.ConversationId);
                entity.HasIndex(e => e.SenderId);
                entity.HasIndex(e => e.CreatedAt);
                entity.HasIndex(e => new { e.ConversationId, e.CreatedAt });

                entity.HasOne(m => m.Conversation)
                    .WithMany(c => c.Messages)
                    .HasForeignKey(m => m.ConversationId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(m => m.Sender)
                    .WithMany(u => u.SentMessages)
                    .HasForeignKey(m => m.SenderId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(m => m.ReplyToMessage)
                    .WithMany()
                    .HasForeignKey(m => m.ReplyToMessageId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.Property(m => m.Content)
                    .HasMaxLength(5000);

                entity.Property(m => m.MessageType)
                    .IsRequired()
                    .HasMaxLength(20)
                    .HasDefaultValue("text");

                entity.Property(m => m.FileName)
                    .HasMaxLength(255);
            });

            // Налаштування моделі MessageReadStatus
            modelBuilder.Entity<MessageReadStatus>(entity =>
            {
                entity.HasIndex(e => new { e.MessageId, e.UserId })
                    .IsUnique()
                    .HasDatabaseName("IX_MessageReadStatus_MessageId_UserId");

                entity.HasIndex(e => e.UserId);

                entity.HasOne(mrs => mrs.Message)
                    .WithMany(m => m.ReadStatuses)
                    .HasForeignKey(mrs => mrs.MessageId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(mrs => mrs.User)
                    .WithMany(u => u.MessageReadStatuses)
                    .HasForeignKey(mrs => mrs.UserId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.Property(mrs => mrs.IsDelivered)
                    .HasDefaultValue(true);
            });
        }
    }
}
