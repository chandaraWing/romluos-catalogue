'use client';

import { Toaster as Sonner } from 'sonner';

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ duration = 2000, ...props }: ToasterProps) => {
  return (
    <Sonner
      duration={duration}
      theme="light"
      className="toaster group"
      toastOptions={{
        duration: 2000,
        classNames: {
          toast:
            'group toast group-[.toaster]:bg-slate-900 group-[.toaster]:text-slate-100 group-[.toaster]:border-slate-800 group-[.toaster]:shadow-lg',
          description: 'group-[.toast]:text-slate-400',
          actionButton:
            'group-[.toast]:bg-brand group-[.toast]:text-slate-950 font-semibold',
          cancelButton:
            'group-[.toast]:bg-slate-800 group-[.toast]:text-slate-400',
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
