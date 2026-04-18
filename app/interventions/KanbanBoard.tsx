'use client';

import { useState } from 'react';
import {
  DndContext,
  DragOverlay,
  useDraggable,
  useDroppable,
  type DragEndEvent,
} from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import type { Intervention, Client } from '../../lib/types';

type IntStatus = 'En attente' | 'En cours' | 'Prêt' | 'Livré';

const STATUS_ORDER: IntStatus[] = ['En attente', 'En cours', 'Prêt', 'Livré'];

const COLUMN_CONFIG: Record<IntStatus, { dot: string; header: string; bg: string; border: string }> = {
  'En attente': {
    dot: 'bg-slate-400',
    header: 'text-slate-400',
    bg: 'bg-slate-500/5',
    border: 'border-slate-500/20',
  },
  'En cours': {
    dot: 'bg-amber-500',
    header: 'text-amber-400',
    bg: 'bg-amber-500/5',
    border: 'border-amber-500/20',
  },
  'Prêt': {
    dot: 'bg-emerald-500',
    header: 'text-emerald-400',
    bg: 'bg-emerald-500/5',
    border: 'border-emerald-500/20',
  },
  'Livré': {
    dot: 'bg-blue-500',
    header: 'text-blue-400',
    bg: 'bg-blue-500/5',
    border: 'border-blue-500/20',
  },
};

interface Props {
  interventions: Intervention[];
  clients: Client[];
  updatingId: string | null;
  onMoveCard: (intervention: Intervention, newStatus: IntStatus) => void;
}

export default function KanbanBoard({ interventions, clients, updatingId, onMoveCard }: Props) {
  const [activeId, setActiveId] = useState<string | null>(null);

  const getClientName = (id: string) => clients.find(c => c.id === id)?.name ?? 'Client inconnu';
  const activeCard = activeId ? interventions.find(i => i.id === activeId) : null;

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveId(null);
    if (!over) return;
    const card = interventions.find(i => i.id === active.id);
    const newStatus = over.id as IntStatus;
    if (!card || card.status === newStatus || !STATUS_ORDER.includes(newStatus)) return;
    onMoveCard(card, newStatus);
  }

  return (
    <DndContext
      onDragStart={e => setActiveId(String(e.active.id))}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveId(null)}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {STATUS_ORDER.map(status => (
          <KanbanColumn
            key={status}
            status={status}
            cards={interventions.filter(i => i.status === status)}
            getClientName={getClientName}
            updatingId={updatingId}
            isDraggingId={activeId}
          />
        ))}
      </div>

      <DragOverlay>
        {activeCard && (
          <CardPreview card={activeCard} clientName={getClientName(activeCard.clientId)} />
        )}
      </DragOverlay>
    </DndContext>
  );
}

function KanbanColumn({
  status, cards, getClientName, updatingId, isDraggingId,
}: {
  status: IntStatus;
  cards: Intervention[];
  getClientName: (id: string) => string;
  updatingId: string | null;
  isDraggingId: string | null;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  const cfg = COLUMN_CONFIG[status];

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col rounded-xl border transition-all ${
        isOver ? 'border-[#FF6B2B]/50 bg-[#FF6B2B]/5' : `${cfg.border} ${cfg.bg}`
      }`}
    >
      {/* Column header */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-[#2A2D3A]">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${cfg.dot}`} />
          <span className={`text-xs font-semibold ${cfg.header}`}>{status}</span>
        </div>
        <span className="text-xs text-[#8B8FA8] bg-[#2A2D3A] px-1.5 py-0.5 rounded-full">
          {cards.length}
        </span>
      </div>

      {/* Cards */}
      <div className="flex flex-col gap-2 p-2 min-h-[120px]">
        {cards.length === 0 && (
          <div className="flex-1 flex items-center justify-center py-6 text-[11px] text-[#8B8FA8]/50 border border-dashed border-[#2A2D3A]/50 rounded-lg">
            Déposer ici
          </div>
        )}
        {cards.map(card => (
          <DraggableCard
            key={card.id}
            card={card}
            clientName={getClientName(card.clientId)}
            isUpdating={updatingId === card.id}
            isBeingDragged={isDraggingId === card.id}
          />
        ))}
      </div>
    </div>
  );
}

function DraggableCard({
  card, clientName, isUpdating, isBeingDragged,
}: {
  card: Intervention;
  clientName: string;
  isUpdating: boolean;
  isBeingDragged: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({ id: card.id });

  const style = transform
    ? { transform: CSS.Translate.toString(transform) }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`bg-[#1A1D27] border border-[#2A2D3A] rounded-lg p-3 cursor-grab active:cursor-grabbing select-none transition-all ${
        isBeingDragged ? 'opacity-40' : 'hover:border-[#3A3D4A]'
      } ${isUpdating ? 'opacity-60 pointer-events-none' : ''}`}
    >
      <p className="text-xs font-semibold text-white truncate">{clientName}</p>
      <p className="text-[11px] text-[#8B8FA8] truncate mt-0.5">{card.vehicule ?? card.type}</p>
      <div className="flex items-center justify-between mt-2">
        <span className="text-[11px] text-[#8B8FA8]">
          {new Date(card.date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}
        </span>
        <span className="text-[11px] font-semibold text-white">{card.price} €</span>
      </div>
      {isUpdating && (
        <div className="mt-1.5 flex items-center gap-1 text-[10px] text-[#FF6B2B]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#FF6B2B] animate-pulse" />
          Mise à jour…
        </div>
      )}
    </div>
  );
}

function CardPreview({ card, clientName }: { card: Intervention; clientName: string }) {
  return (
    <div className="bg-[#22263A] border border-[#FF6B2B]/40 rounded-lg p-3 w-52 shadow-2xl rotate-2">
      <p className="text-xs font-semibold text-white truncate">{clientName}</p>
      <p className="text-[11px] text-[#8B8FA8] truncate mt-0.5">{card.vehicule ?? card.type}</p>
      <div className="flex items-center justify-between mt-2">
        <span className="text-[11px] text-[#8B8FA8]">
          {new Date(card.date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}
        </span>
        <span className="text-[11px] font-semibold text-white">{card.price} €</span>
      </div>
    </div>
  );
}

