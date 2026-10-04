import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand disabled:pointer-events-none disabled:opacity-50 cursor-pointer select-none active:scale-[0.98]',
  {
    variants: {
      variant: {
        default:
          'bg-brand text-slate-950 font-bold hover:brightness-110 shadow-lg shadow-brand/20',
        gradient:
          'bg-brand-gradient-solid text-white font-bold shadow-lg shadow-brand/20 hover:scale-[1.02] active:scale-[0.98] hover:brightness-105 transition-all border-0',
        'brand-gradient':
          'bg-brand-gradient-solid text-white font-bold shadow-lg shadow-brand/20 hover:scale-[1.02] active:scale-[0.98] hover:brightness-105 transition-all border-0',
        'gradient-outline':
          'border border-transparent [background:linear-gradient(#ffffff,#ffffff)_padding-box,linear-gradient(135deg,#A9CB37_0%,#0077FF_100%)_border-box] dark:[background:linear-gradient(#070b14,#070b14)_padding-box,linear-gradient(135deg,#A9CB37_0%,#0077FF_100%)_border-box] hover:shadow-lg hover:shadow-brand/20 transition-all',
        'outline-gradient':
          'border border-transparent [background:linear-gradient(#ffffff,#ffffff)_padding-box,linear-gradient(135deg,#A9CB37_0%,#0077FF_100%)_border-box] dark:[background:linear-gradient(#070b14,#070b14)_padding-box,linear-gradient(135deg,#A9CB37_0%,#0077FF_100%)_border-box] hover:shadow-lg hover:shadow-brand/20 transition-all',
        'gradient-glass':
          'border-0 bg-brand-gradient-solid text-white font-bold shadow-lg shadow-brand/20 hover:scale-[1.02] active:scale-[0.98] hover:brightness-105 dark:backdrop-blur-xl dark:bg-gradient-to-br dark:from-primary/30 dark:via-primary/15 dark:to-primary/30 dark:hover:from-primary/40 dark:hover:via-primary/25 dark:hover:to-primary/40 dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.3),0_4px_16px_rgba(169,203,55,0.2)] dark:hover:shadow-[inset_0_1px_1px_rgba(255,255,255,0.45),0_6px_20px_rgba(169,203,55,0.3)] transition-all',
        'primary-glass':
          'backdrop-blur-xl border-0 bg-primary/15 text-primary hover:bg-primary/25 dark:bg-primary/20 dark:text-primary dark:hover:bg-primary/30 dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.3),0_4px_14px_rgba(0,119,255,0.2)] transition-all',
        'secondary-glass':
          'backdrop-blur-xl border-0 bg-secondary/15 text-secondary hover:bg-secondary/25 dark:bg-secondary/20 dark:text-secondary dark:hover:bg-secondary/30 dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.3),0_4px_14px_rgba(169,203,55,0.2)] transition-all',
        glass:
          'backdrop-blur-xl border-0 bg-primary/10 hover:bg-primary/20 text-primary dark:bg-gradient-to-br dark:from-primary/30 dark:via-primary/15 dark:to-primary/30 dark:hover:from-primary/40 dark:hover:via-primary/25 dark:hover:to-primary/40 dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.3),0_4px_16px_rgba(169,203,55,0.2)] dark:hover:shadow-[inset_0_1px_1px_rgba(255,255,255,0.45),0_6px_20px_rgba(169,203,55,0.3)] transition-all',
        'glass-glow':
          'backdrop-blur-xl border-0 bg-primary/10 hover:bg-primary/20 text-primary dark:bg-gradient-to-br dark:from-primary/30 dark:via-primary/15 dark:to-primary/30 dark:hover:from-primary/40 dark:hover:via-primary/25 dark:hover:to-primary/40 dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.3),0_4px_16px_rgba(169,203,55,0.2)] dark:hover:shadow-[inset_0_1px_1px_rgba(255,255,255,0.45),0_6px_20px_rgba(169,203,55,0.3)] transition-all',
        'glass-selected':
          'backdrop-blur-xl border-0 bg-secondary/15 text-secondary hover:bg-secondary/25 dark:bg-secondary/20 dark:text-secondary dark:hover:bg-secondary/30 dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.3),0_4px_14px_rgba(169,203,55,0.2)] transition-all',
        primary:
          'bg-brand-blue text-white font-bold hover:brightness-110 shadow-lg shadow-brand-blue/20',
        destructive:
          'bg-rose-500 text-white hover:bg-rose-600 shadow-sm',
        'destructive-outline':
          'border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400',
        outline:
          'border border-slate-700 bg-slate-900/60 hover:bg-slate-800 hover:border-slate-600 text-slate-200',
        secondary:
          'bg-secondary text-secondary-foreground font-bold hover:brightness-110 shadow-lg shadow-secondary/20',
        ghost:
          'hover:bg-slate-800/60 hover:text-white text-slate-400',
        link:
          'text-brand underline-offset-4 hover:underline p-0 h-auto',
      },
      size: {
        default: 'h-11 px-5 py-2.5',
        sm: 'h-9 px-3.5 text-xs',
        lg: 'h-12 px-7 text-base',
        icon: 'h-10 w-10 p-0',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  isLoading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, isLoading = false, disabled, children, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && <Loader2 className="w-4 h-4 animate-spin shrink-0" />}
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
export default Button;
