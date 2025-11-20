import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars, faMapPin, faMinusCircle } from '@fortawesome/free-solid-svg-icons';

export function SortableItem(props: any) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: props.id, disabled: !props.isEditing });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} className="relative flex items-center bg-white p-2 my-1 rounded shadow gap-1 sm:gap-2">
      <button {...listeners} className={`cursor-grab p-1 shrink-0 ${props.isEditing ? '' : 'invisible'}`}>
        <FontAwesomeIcon icon={faBars} className="h-4 w-4 sm:h-5 sm:w-5 text-gray-500" />
      </button>
      <FontAwesomeIcon icon={faMapPin} className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500 shrink-0" />
      <input
        type="text"
        value={props.label}
        disabled={!props.isEditing}
        onChange={(e) => props.onNameChange(props.id, e.target.value)}
        onFocus={() => props.onFocus(props.id)}
        onBlur={props.onBlur}
        className="grow bg-transparent focus:outline-none disabled:bg-white disabled:cursor-not-allowed text-sm truncate"
        autoComplete="off"
      />
      <button onClick={() => props.onRemove(props.id)} className={`p-1 shrink-0 ${props.isEditing ? '' : 'invisible'}`}>
        <FontAwesomeIcon icon={faMinusCircle} className="h-4 w-4 sm:h-5 sm:w-5 text-red-500 hover:text-red-700" />
      </button>
    </div>
  );
}
