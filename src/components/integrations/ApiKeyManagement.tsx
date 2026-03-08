import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Key, Plus, Copy, Eye, EyeOff, Trash2, Clock, Check, AlertTriangle } from 'lucide-react';
import { useApiKeys, API_SCOPES, CreateApiKeyInput } from '@/hooks/useApiKeys';
import { format } from 'date-fns';
import { toast } from 'sonner';

export function ApiKeyManagement() {
  const { apiKeys, isLoading, newlyCreatedKey, createApiKey, revokeApiKey, clearNewlyCreatedKey } = useApiKeys();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [selectedScopes, setSelectedScopes] = useState<string[]>([]);
  const [expiresInDays, setExpiresInDays] = useState<number | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null);

  const handleCreateKey = async () => {
    if (!newKeyName.trim()) {
      toast.error('Please enter a name for the API key');
      return;
    }
    if (selectedScopes.length === 0) {
      toast.error('Please select at least one scope');
      return;
    }

    setIsCreating(true);
    const input: CreateApiKeyInput = {
      name: newKeyName.trim(),
      scopes: selectedScopes,
      expires_at: expiresInDays ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000).toISOString() : undefined,
    };

    const key = await createApiKey(input);
    setIsCreating(false);

    if (key) {
      setIsCreateDialogOpen(false);
      setNewKeyName('');
      setSelectedScopes([]);
      setExpiresInDays(null);
    }
  };

  const handleCopyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    setCopiedKeyId(key);
    toast.success('API key copied to clipboard');
    setTimeout(() => setCopiedKeyId(null), 2000);
  };

  const toggleScope = (scope: string) => {
    setSelectedScopes(prev =>
      prev.includes(scope)
        ? prev.filter(s => s !== scope)
        : [...prev, scope]
    );
  };

  const activeKeys = apiKeys.filter(k => k.status === 'active');
  const revokedKeys = apiKeys.filter(k => k.status !== 'active');

  return (
    <div className="space-y-6">
      {/* New Key Alert */}
      {newlyCreatedKey && (
        <Card className="border-green-500 bg-green-500/10">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-green-600">
              <Check className="h-5 w-5" />
              API Key Created
            </CardTitle>
            <CardDescription>
              Copy this key now. It won't be shown again!
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <code className="flex-1 p-3 bg-background rounded border font-mono text-sm break-all">
                {newlyCreatedKey}
              </code>
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleCopyKey(newlyCreatedKey)}
              >
                {copiedKeyId === newlyCreatedKey ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="mt-2"
              onClick={clearNewlyCreatedKey}
            >
              Dismiss
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">API Keys</h3>
          <p className="text-sm text-muted-foreground">
            Manage API keys for external integrations
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create API Key
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Create API Key</DialogTitle>
              <DialogDescription>
                Create a new API key for external integrations.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Key Name</Label>
                <Input
                  placeholder="e.g., ERP Integration"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                />
              </div>
              <div>
                <Label>Scopes</Label>
                <ScrollArea className="h-48 border rounded-md p-3 mt-1">
                  <div className="space-y-3">
                    {API_SCOPES.map((scope) => (
                      <div key={scope.value} className="flex items-start gap-2">
                        <Checkbox
                          id={scope.value}
                          checked={selectedScopes.includes(scope.value)}
                          onCheckedChange={() => toggleScope(scope.value)}
                        />
                        <div className="grid gap-0.5">
                          <label htmlFor={scope.value} className="text-sm font-medium cursor-pointer">
                            {scope.label}
                          </label>
                          <span className="text-xs text-muted-foreground">
                            {scope.description}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
              <div>
                <Label>Expiration (optional)</Label>
                <div className="flex gap-2 mt-1">
                  <Button
                    variant={expiresInDays === null ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setExpiresInDays(null)}
                  >
                    Never
                  </Button>
                  <Button
                    variant={expiresInDays === 30 ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setExpiresInDays(30)}
                  >
                    30 days
                  </Button>
                  <Button
                    variant={expiresInDays === 90 ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setExpiresInDays(90)}
                  >
                    90 days
                  </Button>
                  <Button
                    variant={expiresInDays === 365 ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setExpiresInDays(365)}
                  >
                    1 year
                  </Button>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateKey} disabled={isCreating}>
                {isCreating ? 'Creating...' : 'Create Key'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Active Keys */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Active Keys ({activeKeys.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : activeKeys.length === 0 ? (
            <p className="text-muted-foreground">No active API keys</p>
          ) : (
            <div className="space-y-4">
              {activeKeys.map((key) => (
                <div key={key.id} className="flex items-start justify-between p-4 border rounded-lg">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Key className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{key.name}</span>
                      <Badge variant="outline" className="text-green-600">Active</Badge>
                    </div>
                    <code className="text-sm text-muted-foreground">
                      {key.key_prefix}...
                    </code>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {key.scopes.map((scope) => (
                        <Badge key={scope} variant="secondary" className="text-xs">
                          {scope}
                        </Badge>
                      ))}
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
                      <span>Created: {format(new Date(key.created_at), 'MMM d, yyyy')}</span>
                      {key.last_used_at && (
                        <span>Last used: {format(new Date(key.last_used_at), 'MMM d, yyyy HH:mm')}</span>
                      )}
                      {key.expires_at && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Expires: {format(new Date(key.expires_at), 'MMM d, yyyy')}
                        </span>
                      )}
                    </div>
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Revoke API Key?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will immediately revoke the key "{key.name}". Any integrations using this key will stop working.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          className="bg-destructive text-destructive-foreground"
                          onClick={() => revokeApiKey(key.id)}
                        >
                          Revoke Key
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Revoked Keys */}
      {revokedKeys.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base text-muted-foreground">Revoked Keys ({revokedKeys.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {revokedKeys.map((key) => (
                <div key={key.id} className="flex items-center justify-between p-3 border rounded-lg opacity-60">
                  <div className="flex items-center gap-2">
                    <Key className="h-4 w-4 text-muted-foreground" />
                    <span className="line-through">{key.name}</span>
                    <Badge variant="outline" className="text-destructive">Revoked</Badge>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(key.created_at), 'MMM d, yyyy')}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
