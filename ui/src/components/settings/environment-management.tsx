import { useState } from 'react'
import { IconEdit, IconPlus, IconTrash } from '@tabler/icons-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ColumnDef } from '@tanstack/react-table'
import { toast } from 'sonner'

import { EnvironmentType } from '@/types/api'
import {
  createEnvironmentType,
  deleteEnvironmentType,
  updateEnvironmentType,
  useEnvironmentTypes,
} from '@/lib/api'
import { AVAILABLE_ENV_COLORS, COLOR_BORDER, COLOR_DOT, cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DeleteConfirmationDialog } from '@/components/delete-confirmation-dialog'

import { Action, ActionTable } from '../action-table'

interface EnvTypeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  envType?: EnvironmentType | null
  onSubmit: (data: { name: string; color: string }) => void
}

function EnvTypeDialog({ open, onOpenChange, envType, onSubmit }: EnvTypeDialogProps) {
  const isEdit = !!envType
  const [name, setName] = useState(envType?.name ?? '')
  const [color, setColor] = useState(envType?.color ?? 'blue')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({ name, color })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {open && (
        <DialogContent className={cn('sm:max-w-[420px] border-t-4', COLOR_BORDER[color] ?? 'border-t-gray-300')}>
          <DialogHeader>
            <DialogTitle>
              {isEdit ? 'Edit Environment Type' : 'Add Environment Type'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="env-name">Name {!isEdit && '*'}</Label>
              {isEdit ? (
                <p className="text-sm font-medium">{envType?.name}</p>
              ) : (
                <Input
                  id="env-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., staging"
                  required
                />
              )}
            </div>
            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex flex-wrap gap-2">
                {AVAILABLE_ENV_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    title={c}
                    onClick={() => setColor(c)}
                    className={cn(
                      'h-7 w-7 rounded-full transition-all',
                      COLOR_DOT[c],
                      color === c
                        ? 'ring-2 ring-offset-2 ring-foreground scale-110'
                        : 'opacity-70 hover:opacity-100'
                    )}
                  />
                ))}
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={!name}>
                {isEdit ? 'Save' : 'Add'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      )}
    </Dialog>
  )
}

export function EnvironmentManagement() {
  const queryClient = useQueryClient()
  const { data: envTypes = [] } = useEnvironmentTypes()

  const [showDialog, setShowDialog] = useState(false)
  const [editingEnv, setEditingEnv] = useState<EnvironmentType | null>(null)
  const [deletingEnv, setDeletingEnv] = useState<EnvironmentType | null>(null)

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ['environment-types'] })

  const createMutation = useMutation({
    mutationFn: createEnvironmentType,
    onSuccess: () => {
      toast.success('Environment type created')
      setShowDialog(false)
      invalidate()
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: { name: string; color: string } }) =>
      updateEnvironmentType(id, data),
    onSuccess: () => {
      toast.success('Environment type updated')
      setShowDialog(false)
      setEditingEnv(null)
      invalidate()
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const deleteMutation = useMutation({
    mutationFn: deleteEnvironmentType,
    onSuccess: () => {
      toast.success('Environment type deleted')
      setDeletingEnv(null)
      invalidate()
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const handleSubmit = (data: { name: string; color: string }) => {
    if (editingEnv) {
      updateMutation.mutate({ id: editingEnv.id, data })
    } else {
      createMutation.mutate(data)
    }
  }

  const columns: ColumnDef<EnvironmentType>[] = [
    {
      id: 'name',
      header: 'Name',
      cell: ({ row: { original: env } }) => (
        <div className="flex items-center gap-2">
          <span
            className={cn(
              'inline-block h-3 w-3 shrink-0 rounded-full',
              COLOR_DOT[env.color] ?? 'bg-gray-400'
            )}
          />
          <span className="font-medium">{env.name}</span>
        </div>
      ),
    },
    {
      id: 'color',
      header: 'Color',
      cell: ({ row: { original: env } }) => (
        <span className="capitalize text-sm text-muted-foreground">{env.color}</span>
      ),
    },
  ]

  const actions: Action<EnvironmentType>[] = [
    {
      label: (
        <>
          <IconEdit className="h-4 w-4" />
          Edit
        </>
      ),
      onClick: (env) => {
        setEditingEnv(env)
        setShowDialog(true)
      },
    },
    {
      label: (
        <div className="inline-flex items-center gap-2 text-destructive">
          <IconTrash className="h-4 w-4" />
          Delete
        </div>
      ),
      shouldDisable: (env) => env.name === 'default',
      onClick: (env) => setDeletingEnv(env),
    },
  ]

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Environment Types</CardTitle>
          <Button
            size="sm"
            onClick={() => {
              setEditingEnv(null)
              setShowDialog(true)
            }}
          >
            <IconPlus className="h-4 w-4 mr-1" />
            Add Environment
          </Button>
        </CardHeader>
        <CardContent>
          <ActionTable
            data={envTypes}
            columns={columns}
            actions={actions}
          />
        </CardContent>
      </Card>

      <EnvTypeDialog
        key={editingEnv?.id ?? 'new'}
        open={showDialog}
        onOpenChange={(open) => {
          setShowDialog(open)
          if (!open) setEditingEnv(null)
        }}
        envType={editingEnv}
        onSubmit={handleSubmit}
      />

      {deletingEnv && (
        <DeleteConfirmationDialog
          open={!!deletingEnv}
          onOpenChange={(open) => !open && setDeletingEnv(null)}
          onConfirm={() => deleteMutation.mutate(deletingEnv.id)}
          resourceName={deletingEnv.name}
          resourceType="environment type"
        />
      )}
    </div>
  )
}
