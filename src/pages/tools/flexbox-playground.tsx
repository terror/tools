import { Tool } from '@/components/tool';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { Copy, Minus, Plus, RotateCcw } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { toast } from 'sonner';

const ITEM_COLORS = [
  'bg-rose-500',
  'bg-amber-500',
  'bg-emerald-500',
  'bg-sky-500',
  'bg-violet-500',
  'bg-pink-500',
  'bg-teal-500',
  'bg-orange-500',
  'bg-indigo-500',
  'bg-lime-500',
  'bg-cyan-500',
  'bg-fuchsia-500',
];

type FlexDirection = 'row' | 'row-reverse' | 'column' | 'column-reverse';
type JustifyContent =
  | 'flex-start'
  | 'flex-end'
  | 'center'
  | 'space-between'
  | 'space-around'
  | 'space-evenly';
type AlignItems = 'flex-start' | 'flex-end' | 'center' | 'stretch' | 'baseline';
type FlexWrap = 'nowrap' | 'wrap' | 'wrap-reverse';
type AlignContent =
  | 'flex-start'
  | 'flex-end'
  | 'center'
  | 'stretch'
  | 'space-between'
  | 'space-around';
type AlignSelf =
  | 'auto'
  | 'flex-start'
  | 'flex-end'
  | 'center'
  | 'stretch'
  | 'baseline';

interface ContainerProps {
  flexDirection: FlexDirection;
  justifyContent: JustifyContent;
  alignItems: AlignItems;
  flexWrap: FlexWrap;
  alignContent: AlignContent;
  gap: number;
}

interface ItemProps {
  id: number;
  flexGrow: number;
  flexShrink: number;
  flexBasis: string;
  alignSelf: AlignSelf;
  order: number;
}

const DEFAULT_CONTAINER: ContainerProps = {
  flexDirection: 'row',
  justifyContent: 'flex-start',
  alignItems: 'stretch',
  flexWrap: 'nowrap',
  alignContent: 'stretch',
  gap: 12,
};

const DEFAULT_ITEM: Omit<ItemProps, 'id'> = {
  flexGrow: 0,
  flexShrink: 1,
  flexBasis: 'auto',
  alignSelf: 'auto',
  order: 0,
};

function createItem(id: number): ItemProps {
  return { id, ...DEFAULT_ITEM };
}

interface PropertySelectProps<T extends string> {
  label: string;
  value: T;
  options: readonly T[];
  onChange: (value: T) => void;
  highlight?: boolean;
}

function PropertySelect<T extends string>({
  label,
  value,
  options,
  onChange,
  highlight,
}: PropertySelectProps<T>) {
  return (
    <div className='space-y-1.5'>
      <label className='text-muted-foreground text-xs font-medium'>
        {label}
      </label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger
          className={cn(
            'h-8 text-xs',
            highlight && 'border-primary ring-primary/20 ring-2'
          )}
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option} value={option} className='text-xs'>
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

interface PropertyInputProps {
  label: string;
  value: string | number;
  onChange: (value: string) => void;
  type?: 'text' | 'number';
  min?: number;
  highlight?: boolean;
}

function PropertyInput({
  label,
  value,
  onChange,
  type = 'text',
  min,
  highlight,
}: PropertyInputProps) {
  return (
    <div className='space-y-1.5'>
      <label className='text-muted-foreground text-xs font-medium'>
        {label}
      </label>
      <Input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        min={min}
        className={cn(
          'h-8 text-xs',
          highlight && 'border-primary ring-primary/20 ring-2'
        )}
      />
    </div>
  );
}

export function FlexboxPlaygroundTool() {
  const [container, setContainer] = useState<ContainerProps>(DEFAULT_CONTAINER);
  const [items, setItems] = useState<ItemProps[]>([
    createItem(1),
    createItem(2),
    createItem(3),
  ]);
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null);
  const [nextId, setNextId] = useState(4);

  const selectedItem = useMemo(
    () => items.find((item) => item.id === selectedItemId) ?? null,
    [items, selectedItemId]
  );

  const updateContainer = useCallback(
    <K extends keyof ContainerProps>(key: K, value: ContainerProps[K]) => {
      setContainer((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const updateItem = useCallback(
    <K extends keyof ItemProps>(id: number, key: K, value: ItemProps[K]) => {
      setItems((prev) =>
        prev.map((item) => (item.id === id ? { ...item, [key]: value } : item))
      );
    },
    []
  );

  const addItem = useCallback(() => {
    setItems((prev) => [...prev, createItem(nextId)]);
    setNextId((prev) => prev + 1);
  }, [nextId]);

  const removeItem = useCallback(
    (id: number) => {
      setItems((prev) => prev.filter((item) => item.id !== id));
      if (selectedItemId === id) {
        setSelectedItemId(null);
      }
    },
    [selectedItemId]
  );

  const resetAll = useCallback(() => {
    setContainer(DEFAULT_CONTAINER);
    setItems([createItem(1), createItem(2), createItem(3)]);
    setSelectedItemId(null);
    setNextId(4);
  }, []);

  const generatedCSS = useMemo(() => {
    const containerCSS = `.container {
  display: flex;
  flex-direction: ${container.flexDirection};
  justify-content: ${container.justifyContent};
  align-items: ${container.alignItems};
  flex-wrap: ${container.flexWrap};
  align-content: ${container.alignContent};
  gap: ${container.gap}px;
}`;

    const itemsWithCustomProps = items.filter(
      (item) =>
        item.flexGrow !== DEFAULT_ITEM.flexGrow ||
        item.flexShrink !== DEFAULT_ITEM.flexShrink ||
        item.flexBasis !== DEFAULT_ITEM.flexBasis ||
        item.alignSelf !== DEFAULT_ITEM.alignSelf ||
        item.order !== DEFAULT_ITEM.order
    );

    if (itemsWithCustomProps.length === 0) {
      return containerCSS;
    }

    const itemCSS = itemsWithCustomProps
      .map((item) => {
        const props: string[] = [];
        if (item.flexGrow !== DEFAULT_ITEM.flexGrow)
          props.push(`  flex-grow: ${item.flexGrow};`);
        if (item.flexShrink !== DEFAULT_ITEM.flexShrink)
          props.push(`  flex-shrink: ${item.flexShrink};`);
        if (item.flexBasis !== DEFAULT_ITEM.flexBasis)
          props.push(`  flex-basis: ${item.flexBasis};`);
        if (item.alignSelf !== DEFAULT_ITEM.alignSelf)
          props.push(`  align-self: ${item.alignSelf};`);
        if (item.order !== DEFAULT_ITEM.order)
          props.push(`  order: ${item.order};`);
        return `.item-${item.id} {\n${props.join('\n')}\n}`;
      })
      .join('\n\n');

    return `${containerCSS}\n\n${itemCSS}`;
  }, [container, items]);

  const copyCSS = useCallback(() => {
    navigator.clipboard.writeText(generatedCSS);
    toast.success('CSS copied to clipboard');
  }, [generatedCSS]);

  return (
    <Tool toolId='flexbox-playground'>
      <div className='space-y-6'>
        {/* Controls */}
        <div className='grid gap-6 lg:grid-cols-2'>
          {/* Container Properties */}
          <div className='border-border bg-card space-y-4 rounded-xl border p-5'>
            <div className='flex items-center justify-between'>
              <h3 className='font-semibold'>Container Properties</h3>
              <Button
                variant='ghost'
                size='icon-sm'
                onClick={resetAll}
                title='Reset all'
              >
                <RotateCcw className='h-4 w-4' />
              </Button>
            </div>
            <div className='grid grid-cols-2 gap-3 sm:grid-cols-3'>
              <PropertySelect
                label='flex-direction'
                value={container.flexDirection}
                options={
                  ['row', 'row-reverse', 'column', 'column-reverse'] as const
                }
                onChange={(v) => updateContainer('flexDirection', v)}
                highlight={
                  container.flexDirection !== DEFAULT_CONTAINER.flexDirection
                }
              />
              <PropertySelect
                label='justify-content'
                value={container.justifyContent}
                options={
                  [
                    'flex-start',
                    'flex-end',
                    'center',
                    'space-between',
                    'space-around',
                    'space-evenly',
                  ] as const
                }
                onChange={(v) => updateContainer('justifyContent', v)}
                highlight={
                  container.justifyContent !== DEFAULT_CONTAINER.justifyContent
                }
              />
              <PropertySelect
                label='align-items'
                value={container.alignItems}
                options={
                  [
                    'flex-start',
                    'flex-end',
                    'center',
                    'stretch',
                    'baseline',
                  ] as const
                }
                onChange={(v) => updateContainer('alignItems', v)}
                highlight={
                  container.alignItems !== DEFAULT_CONTAINER.alignItems
                }
              />
              <PropertySelect
                label='flex-wrap'
                value={container.flexWrap}
                options={['nowrap', 'wrap', 'wrap-reverse'] as const}
                onChange={(v) => updateContainer('flexWrap', v)}
                highlight={container.flexWrap !== DEFAULT_CONTAINER.flexWrap}
              />
              <PropertySelect
                label='align-content'
                value={container.alignContent}
                options={
                  [
                    'flex-start',
                    'flex-end',
                    'center',
                    'stretch',
                    'space-between',
                    'space-around',
                  ] as const
                }
                onChange={(v) => updateContainer('alignContent', v)}
                highlight={
                  container.alignContent !== DEFAULT_CONTAINER.alignContent
                }
              />
              <PropertyInput
                label='gap (px)'
                value={container.gap}
                onChange={(v) => updateContainer('gap', parseInt(v) || 0)}
                type='number'
                min={0}
                highlight={container.gap !== DEFAULT_CONTAINER.gap}
              />
            </div>
          </div>

          {/* Item Properties */}
          <div className='border-border bg-card space-y-4 rounded-xl border p-5'>
            <div className='flex items-center justify-between'>
              <h3 className='font-semibold'>
                Item Properties
                {selectedItem && (
                  <span className='text-muted-foreground ml-2 text-sm font-normal'>
                    (Item {selectedItem.id})
                  </span>
                )}
              </h3>
              <div className='flex gap-1'>
                <Button
                  variant='ghost'
                  size='icon-sm'
                  onClick={addItem}
                  title='Add item'
                  disabled={items.length >= 12}
                >
                  <Plus className='h-4 w-4' />
                </Button>
                <Button
                  variant='ghost'
                  size='icon-sm'
                  onClick={() => selectedItemId && removeItem(selectedItemId)}
                  title='Remove selected item'
                  disabled={!selectedItemId || items.length <= 1}
                >
                  <Minus className='h-4 w-4' />
                </Button>
              </div>
            </div>
            {selectedItem ? (
              <div className='grid grid-cols-2 gap-3 sm:grid-cols-3'>
                <PropertyInput
                  label='flex-grow'
                  value={selectedItem.flexGrow}
                  onChange={(v) =>
                    updateItem(
                      selectedItem.id,
                      'flexGrow',
                      Math.max(0, parseInt(v) || 0)
                    )
                  }
                  type='number'
                  min={0}
                  highlight={selectedItem.flexGrow !== DEFAULT_ITEM.flexGrow}
                />
                <PropertyInput
                  label='flex-shrink'
                  value={selectedItem.flexShrink}
                  onChange={(v) =>
                    updateItem(
                      selectedItem.id,
                      'flexShrink',
                      Math.max(0, parseInt(v) || 0)
                    )
                  }
                  type='number'
                  min={0}
                  highlight={
                    selectedItem.flexShrink !== DEFAULT_ITEM.flexShrink
                  }
                />
                <PropertyInput
                  label='flex-basis'
                  value={selectedItem.flexBasis}
                  onChange={(v) =>
                    updateItem(selectedItem.id, 'flexBasis', v || 'auto')
                  }
                  highlight={selectedItem.flexBasis !== DEFAULT_ITEM.flexBasis}
                />
                <PropertySelect
                  label='align-self'
                  value={selectedItem.alignSelf}
                  options={
                    [
                      'auto',
                      'flex-start',
                      'flex-end',
                      'center',
                      'stretch',
                      'baseline',
                    ] as const
                  }
                  onChange={(v) => updateItem(selectedItem.id, 'alignSelf', v)}
                  highlight={selectedItem.alignSelf !== DEFAULT_ITEM.alignSelf}
                />
                <PropertyInput
                  label='order'
                  value={selectedItem.order}
                  onChange={(v) =>
                    updateItem(selectedItem.id, 'order', parseInt(v) || 0)
                  }
                  type='number'
                  highlight={selectedItem.order !== DEFAULT_ITEM.order}
                />
              </div>
            ) : (
              <div className='text-muted-foreground flex h-[88px] items-center justify-center text-sm'>
                Click on an item in the preview to edit its properties
              </div>
            )}
          </div>
        </div>

        {/* Preview */}
        <div className='border-border bg-card overflow-hidden rounded-xl border'>
          <div className='border-border flex items-center justify-between border-b px-5 py-3'>
            <h3 className='font-semibold'>Preview</h3>
            <div className='text-muted-foreground text-xs'>
              {items.length} item{items.length !== 1 ? 's' : ''}
            </div>
          </div>
          <div
            className='bg-muted/30 min-h-[300px] p-4'
            style={{
              backgroundImage:
                'radial-gradient(circle, hsl(var(--muted-foreground) / 0.15) 1px, transparent 1px)',
              backgroundSize: '16px 16px',
            }}
          >
            <div
              className='border-primary/30 bg-background/50 min-h-[268px] rounded-lg border-2 border-dashed p-3 backdrop-blur-sm'
              style={{
                display: 'flex',
                flexDirection: container.flexDirection,
                justifyContent: container.justifyContent,
                alignItems: container.alignItems,
                flexWrap: container.flexWrap,
                alignContent: container.alignContent,
                gap: `${container.gap}px`,
              }}
            >
              {items.map((item, index) => {
                const isSelected = selectedItemId === item.id;
                const colorClass = ITEM_COLORS[index % ITEM_COLORS.length];
                const hasCustomProps =
                  item.flexGrow !== DEFAULT_ITEM.flexGrow ||
                  item.flexShrink !== DEFAULT_ITEM.flexShrink ||
                  item.flexBasis !== DEFAULT_ITEM.flexBasis ||
                  item.alignSelf !== DEFAULT_ITEM.alignSelf ||
                  item.order !== DEFAULT_ITEM.order;

                return (
                  <button
                    key={item.id}
                    onClick={() =>
                      setSelectedItemId(isSelected ? null : item.id)
                    }
                    className={cn(
                      'flex min-h-[60px] min-w-[60px] cursor-pointer items-center justify-center rounded-lg font-bold text-white shadow-lg transition-all',
                      colorClass,
                      isSelected &&
                        'ring-primary ring-offset-background scale-105 ring-4 ring-offset-2',
                      !isSelected && 'hover:scale-105 hover:shadow-xl',
                      hasCustomProps && !isSelected && 'ring-2 ring-white/50'
                    )}
                    style={{
                      flexGrow: item.flexGrow,
                      flexShrink: item.flexShrink,
                      flexBasis: item.flexBasis,
                      alignSelf: item.alignSelf,
                      order: item.order,
                    }}
                    title={`Item ${item.id}${hasCustomProps ? ' (custom properties)' : ''}`}
                  >
                    {item.id}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Generated CSS */}
        <div className='border-border bg-card overflow-hidden rounded-xl border'>
          <div className='border-border flex items-center justify-between border-b px-5 py-3'>
            <h3 className='font-semibold'>Generated CSS</h3>
            <Button
              variant='ghost'
              size='sm'
              onClick={copyCSS}
              className='gap-2'
            >
              <Copy className='h-3.5 w-3.5' />
              Copy
            </Button>
          </div>
          <pre className='bg-muted/30 overflow-x-auto p-5'>
            <code className='text-sm'>{generatedCSS}</code>
          </pre>
        </div>
      </div>
    </Tool>
  );
}
