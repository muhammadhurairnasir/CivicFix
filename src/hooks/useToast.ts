export function useToast() {
  return {
    toast: ({ title, description, variant }: { title: string; description?: string; variant?: 'success' | 'danger' | 'default' }) => {
      // In a real app this would hook into a ToastContext
      // For now we just use console/alert
      console.log(`[Toast ${variant}] ${title}: ${description}`);
      // alert(`${title}\n${description || ''}`);
    }
  };
}
