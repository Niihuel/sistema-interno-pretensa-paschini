import { SetMetadata } from '@nestjs/common';
import { AuditAction, AuditCategory, AuditSeverity } from '../dto';

export const AUDIT_KEY = 'audit';

export interface AuditOptions {
  /**
   * Action type for this endpoint
   * Will be auto-detected from HTTP method if not specified
   */
  action?: AuditAction;

  /**
   * Entity name (e.g., 'User', 'Equipment', 'Ticket')
   * Required
   */
  entity: string;

  /**
   * Category of the audit log
   * Default: 'DATA'
   */
  category?: AuditCategory;

  /**
   * Severity level
   * Default: 'INFO'
   */
  severity?: AuditSeverity;

  /**
   * Description template
   * Can use placeholders like {userId}, {entity}, {action}
   */
  description?: string;

  /**
   * Whether this action requires review
   * Default: false
   */
  requiresReview?: boolean;

  /**
   * Whether to capture the request body as newValue
   * Default: true for CREATE/UPDATE
   */
  captureBody?: boolean;

  /**
   * Whether to capture the "before" state for UPDATE/DELETE
   * Default: true for UPDATE/DELETE
   */
  captureOldValue?: boolean;
}

/**
 * Decorator to enable audit logging for an endpoint
 *
 * @example
 * @Audit({ entity: 'User', action: AuditAction.CREATE })
 * createUser(@Body() dto: CreateUserDto) { }
 *
 * @Audit({ entity: 'Equipment', action: AuditAction.UPDATE, captureOldValue: true })
 * updateEquipment(@Param('id') id: number, @Body() dto: UpdateEquipmentDto) { }
 *
 * @Audit({ entity: 'Ticket', action: AuditAction.DELETE, severity: AuditSeverity.HIGH })
 * deleteTicket(@Param('id') id: number) { }
 */
export const Audit = (options: AuditOptions) => SetMetadata(AUDIT_KEY, options);
