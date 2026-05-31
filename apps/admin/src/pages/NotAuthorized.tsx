import { ShieldX, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/authStore';

export default function NotAuthorized() {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="max-w-md text-center space-y-6">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10">
          <ShieldX className="h-10 w-10 text-destructive" />
        </div>
        <h1 className="text-2xl font-bold text-foreground">Access Denied</h1>
        <p className="text-muted-foreground">
          You don't have permission to access this page. Your current role
          {user?.role ? ` (${user.role.replace(/_/g, ' ')})` : ''} doesn't
          include access to this resource.
        </p>
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Button variant="outline" onClick={() => navigate(-1)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go Back
          </Button>
          <Button onClick={() => navigate('/auth')}>
            Switch Account
          </Button>
        </div>
      </div>
    </div>
  );
}



