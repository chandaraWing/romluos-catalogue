import React from 'react';
import { Badge } from '@/components/ui/Badge';
import { Status, FinancingRequestStatus } from '@/types';

export interface StatusBadgeProps {
  status: Status | FinancingRequestStatus | string;
  size?: 'sm' | 'md';
}

export function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const getBadgeProps = () => {
    switch (status) {
      case Status.ACTIVE:
      case FinancingRequestStatus.APPROVED:
      case FinancingRequestStatus.ITEMS_COLLECTED:
        return { variant: 'success' as const, label: status };

      case FinancingRequestStatus.QR_GENERATED:
      case FinancingRequestStatus.DOWN_PAYMENT_PAID:
        return { variant: 'warning' as const, label: status.replace(/_/g, ' ') };

      case FinancingRequestStatus.IN_REVIEW:
      case FinancingRequestStatus.SUBMITTED:
        return { variant: 'info' as const, label: 'In Review' };

      case Status.INACTIVE:
      case Status.SUSPENDED:
      case FinancingRequestStatus.REJECTED:
      case FinancingRequestStatus.CANCELLED:
      case FinancingRequestStatus.EXPIRED:
        return { variant: 'danger' as const, label: status };

      default:
        return { variant: 'neutral' as const, label: String(status || 'UNKNOWN') };
    }
  };

  const { variant, label } = getBadgeProps();

  return (
    <Badge variant={variant} size={size} dot>
      {label}
    </Badge>
  );
}
