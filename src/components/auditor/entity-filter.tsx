'use client';

import { useState } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface EntityFilterProps {
  entities: Array<{ id: string; name: string }>;
  selectedEntity: string | null;
  onEntityChange: (entityId: string | null) => void;
  className?: string;
}

/**
 * EntityFilter - Dropdown to filter workbook by specific entity
 *
 * Allows auditor to focus on one customer at a time during testing.
 * Includes "All Entities" option to show complete table.
 */
export function EntityFilter({
  entities,
  selectedEntity,
  onEntityChange,
  className,
}: EntityFilterProps) {
  return (
    <div className={cn('flex items-center gap-4', className)}>
      <label
        htmlFor="entity-filter"
        className="text-sm font-medium text-gray-900 dark:text-white whitespace-nowrap"
      >
        Filter by Entity:
      </label>
      <Select
        value={selectedEntity || 'all'}
        onValueChange={(value) => onEntityChange(value === 'all' ? null : value)}
      >
        <SelectTrigger
          id="entity-filter"
          className="w-[280px] bg-white dark:bg-white/10 border-gray-300 dark:border-white/20"
        >
          <SelectValue placeholder="All Entities" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">
            All Entities ({entities.length})
          </SelectItem>
          {entities.map((entity) => (
            <SelectItem key={entity.id} value={entity.id}>
              {entity.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

interface EntityQuickJumpProps {
  entities: Array<{ id: string; name: string }>;
  selectedEntity: string | null;
  onEntityChange: (entityId: string | null) => void;
  className?: string;
}

/**
 * EntityQuickJump - Chip-based quick navigation for entities
 *
 * Provides fast switching between entities with visual indication
 * of currently selected entity.
 */
export function EntityQuickJump({
  entities,
  selectedEntity,
  onEntityChange,
  className,
}: EntityQuickJumpProps) {
  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {entities.map((entity) => (
        <button
          key={entity.id}
          onClick={() => onEntityChange(entity.id)}
          className={cn(
            'px-3 py-1.5 rounded-full text-sm font-medium transition-all',
            selectedEntity === entity.id
              ? 'bg-crowe-indigo dark:bg-crowe-indigo text-white shadow-md'
              : 'bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-white/20 border border-gray-200 dark:border-white/20'
          )}
        >
          {entity.name}
        </button>
      ))}
      {selectedEntity && (
        <button
          onClick={() => onEntityChange(null)}
          className="px-3 py-1.5 rounded-full text-sm font-medium bg-gray-200 dark:bg-white/20 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-white/30 border border-gray-300 dark:border-white/30"
        >
          Show All
        </button>
      )}
    </div>
  );
}
