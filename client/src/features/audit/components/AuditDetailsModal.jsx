import Modal from "@/shared/ui/Modal";
import Button from "@/shared/ui/Button";
import { ShieldAlert, Database, User, Clock } from "lucide-react";

export default function AuditDetailsModal({ log, onClose }) {
  if (!log) return null;

  return (
    <Modal isOpen={Boolean(log)} onClose={onClose} title="ДЕТАЛІ ЗАПИСУ АУДИТУ">
      <div className="space-y-4 text-left text-xs">
        <div className="grid grid-cols-2 gap-3 bg-bg-secondary p-3 rounded-xl border border-border-color font-mono">
          <div>
            <span className="text-text-muted block text-[10px]">
              Категорія:
            </span>
            <strong className="text-text-primary">{log.category}</strong>
          </div>
          <div>
            <span className="text-text-muted block text-[10px]">
              Рівень (Severity):
            </span>
            <strong className="text-brand uppercase">{log.severity}</strong>
          </div>
          <div>
            <span className="text-text-muted block text-[10px]">
              Дія (Action):
            </span>
            <strong className="text-text-primary">{log.action}</strong>
          </div>
          <div>
            <span className="text-text-muted block text-[10px]">
              Дата та час:
            </span>
            <span className="text-text-primary">
              {new Date(log.createdAt).toLocaleString("uk-UA")}
            </span>
          </div>
        </div>

        <div className="space-y-1.5">
          <span className="font-mono font-bold uppercase text-[10px] text-text-muted flex items-center gap-1">
            <User size={12} /> Ініціатор дії (Actor):
          </span>
          <div className="p-3 rounded-xl border border-border-color bg-bg-secondary/40 font-mono text-[11px] space-y-1">
            <div>
              Email:{" "}
              <span className="text-text-primary font-bold">
                {log.actor?.email}
              </span>
            </div>
            <div>
              Роль: <span className="text-brand">{log.actor?.role}</span>
            </div>
            {log.actor?.ipAddress && <div>IP: {log.actor.ipAddress}</div>}
          </div>
        </div>

        {log.targetEntity && log.targetEntity.entityType && (
          <div className="space-y-1.5">
            <span className="font-mono font-bold uppercase text-[10px] text-text-muted flex items-center gap-1">
              <Database size={12} /> Цільовий об'єкт (Target Entity):
            </span>
            <div className="p-3 rounded-xl border border-border-color bg-bg-secondary/40 font-mono text-[11px] space-y-1">
              <div>
                Тип:{" "}
                <span className="text-text-primary">
                  {log.targetEntity.entityType}
                </span>
              </div>
              {log.targetEntity.entityName && (
                <div>
                  Назва/Ім'я:{" "}
                  <span className="text-text-primary">
                    {log.targetEntity.entityName}
                  </span>
                </div>
              )}
              {log.targetEntity.entityId && (
                <div>ID: {log.targetEntity.entityId}</div>
              )}
            </div>
          </div>
        )}

        {log.payload && (
          <div className="space-y-1.5">
            <span className="font-mono font-bold uppercase text-[10px] text-text-muted flex items-center gap-1">
              <ShieldAlert size={12} /> Метадані та стан (Payload):
            </span>
            <pre className="p-3 rounded-xl border border-border-color bg-bg-secondary text-[10px] font-mono overflow-x-auto max-h-48 text-text-secondary">
              {JSON.stringify(log.payload, null, 2)}
            </pre>
          </div>
        )}

        <div className="flex justify-end pt-2 border-t border-border-color">
          <Button variant="outline" size="sm" onClick={onClose}>
            Закрити
          </Button>
        </div>
      </div>
    </Modal>
  );
}
