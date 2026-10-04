import React from 'react';
import { Badge } from '@/components/ui/Badge';
import { Role } from '@/types';

export interface RoleBadgeProps {
  role: Role | string;
  size?: 'sm' | 'md';
}

export function RoleBadge({ role, size = 'md' }: RoleBadgeProps) {
  const getBadgeProps = () => {
    switch (role) {
      case Role.SUPER_ADMIN:
      case 'SUPER_ADMIN':
        return { variant: 'purple' as const, label: 'Super Admin' };

      case Role.SYSTEM_ADMIN:
      case 'SYSTEM_ADMIN':
        return { variant: 'info' as const, label: 'System Admin' };

      case Role.COMPANY_OWNER:
      case 'COMPANY_OWNER':
        return { variant: 'orange' as const, label: 'Company Owner' };

      case Role.DISTRICT_BANKER:
      case 'DISTRICT_BANKER':
        return { variant: 'success' as const, label: 'District Banker' };

      case Role.BRANCH_REP:
      case 'BRANCH_REP':
        return { variant: 'warning' as const, label: 'Branch Rep' };

      case Role.AUDITOR:
      case 'AUDITOR':
        return { variant: 'neutral' as const, label: 'Auditor' };

      default:
        return { variant: 'neutral' as const, label: String(role).replace(/_/g, ' ') };
    }
  };

  const { variant, label } = getBadgeProps();

  return (
    <Badge variant={variant} size={size}>
      {label}
    </Badge>
  );
}
