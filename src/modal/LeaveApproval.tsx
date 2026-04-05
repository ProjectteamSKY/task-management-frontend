import { workerAvailabilityService, type WorkerLeave } from '@/services/workerAvailability';
import { ClockIcon, AlertIcon, CheckIcon } from '@/components/icons/Icons';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface LeaveWithWorker extends WorkerLeave {
  workerName:   string;
  workerAvatar: string;
}

const leaveTypeStyles: Record<string, string> = {
  sick:      'bg-destructive/10 text-destructive border border-destructive/20',
  casual:    'bg-primary/10 text-primary border border-primary/20',
  annual:    'bg-warning/10 text-warning border border-warning/20',
  maternity: 'bg-purple-500/10 text-purple-400 border border-purple-500/20',
  paternity: 'bg-purple-500/10 text-purple-400 border border-purple-500/20',
  unpaid:    'bg-secondary text-muted-foreground border border-border',
};

// ─── Props ────────────────────────────────────────────────────────────────────

interface LeaveApprovalsDialogProps {
  open:          boolean;
  onOpenChange:  (open: boolean) => void;
  pendingLeaves: LeaveWithWorker[];
  leavesLoading: boolean;
  approvingId:   number | null;
  onApprove:     (leave: LeaveWithWorker) => void;
  onReject:      (leave: LeaveWithWorker) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function LeaveApprovalsDialog({
  open,
  onOpenChange,
  pendingLeaves,
  leavesLoading,
  approvingId,
  onApprove,
  onReject,
}: LeaveApprovalsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Leave Approvals</DialogTitle>
          <DialogDescription>
            Review and action pending leave requests from your team.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-2 space-y-2 max-h-[60vh] overflow-y-auto pr-1">
          {leavesLoading ? (
            <div className="flex items-center justify-center py-10">
              <div className="flex flex-col items-center gap-3">
                <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                <p className="text-xs text-muted-foreground">Loading leave requests…</p>
              </div>
            </div>
          ) : pendingLeaves.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-10 text-center">
              <CheckIcon size={20} className="text-success" />
              <p className="text-sm font-medium text-foreground">All clear</p>
              <p className="text-xs text-muted-foreground">No pending leave requests.</p>
            </div>
          ) : (
            pendingLeaves.map(leave => {
              const isActioning  = approvingId === leave.id;
              const leaveTypeKey = (leave.leave_type ?? '').toLowerCase();

              return (
                <div
                  key={`${leave.worker_id}-${leave.id}`}
                  className="flex items-start gap-3 p-3 rounded-lg border border-border bg-secondary/20 hover:bg-secondary/30 transition-colors"
                >
                  {/* Worker avatar */}
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary shrink-0">
                    {leave.workerAvatar}
                  </div>

                  {/* Leave info + actions */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium text-foreground">{leave.workerName}</p>
                      {leave.leave_type && (
                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${leaveTypeStyles[leaveTypeKey] ?? 'bg-secondary text-muted-foreground border border-border'}`}>
                          {leave.leave_type}
                        </span>
                      )}
                    </div>

                    {/* Date range */}
                    {(leave.from_date || leave.to_date) && (
                      <p className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1">
                        <ClockIcon size={10} />
                        {leave.from_date ?? '—'}
                        {leave.to_date && leave.to_date !== leave.from_date && (
                          <> → {leave.to_date}</>
                        )}
                      </p>
                    )}

                    {/* Reason */}
                    {leave.reason && (
                      <p className="text-[11px] text-muted-foreground/70 mt-1 italic truncate max-w-xs">
                        "{leave.reason}"
                      </p>
                    )}

                    {/* Action buttons */}
                    <div className="flex items-center gap-2 mt-2">
                      <button
                        disabled={isActioning}
                        onClick={() => onApprove(leave)}
                        className="text-[11px] font-medium px-3 py-1 rounded-md bg-success/10 text-success hover:bg-success/20 border border-success/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                      >
                        {isActioning
                          ? <span className="w-3 h-3 border border-success border-t-transparent rounded-full animate-spin inline-block" />
                          : <CheckIcon size={10} />
                        }
                        Approve
                      </button>
                      <button
                        disabled={isActioning}
                        onClick={() => onReject(leave)}
                        className="text-[11px] font-medium px-3 py-1 rounded-md bg-destructive/10 text-destructive hover:bg-destructive/20 border border-destructive/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                      >
                        {isActioning
                          ? <span className="w-3 h-3 border border-destructive border-t-transparent rounded-full animate-spin inline-block" />
                          : <AlertIcon size={10} />
                        }
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}