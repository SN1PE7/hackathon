"use client";
import React, { useState, useEffect } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { SortableItem } from './SortableItem';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faCar, faBicycle, faWalking, faEdit, faSave, faRobot, faChevronRight, faChevronLeft } from '@fortawesome/free-solid-svg-icons';
import { v4 as uuidv4 } from 'uuid';
import { useToast } from '@/components/ui/ToastProvider';

interface Place {
  id: string;
  lat: number;
  lon: number;
  tags: {
    name?: string;
    'name:vi'?: string;
  };
}

interface RoutePlannerProps {
  places?: Place[];
  onWaypointEnter: (index: number) => void;
  onWaypointLeave: () => void;
  onOrderChange: (newOrder: Place[]) => void;
}

const RoutePlanner: React.FC<RoutePlannerProps> = ({ places = [], onWaypointEnter, onWaypointLeave, onOrderChange }) => {
  const [items, setItems] = useState<Place[]>(places);
  const [selectedVehicle, setSelectedVehicle] = useState('car');
  const [isEditing, setIsEditing] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(true);
  const { addToast } = useToast();

  // Use local state for editing to avoid re-rendering the map on every drag
  const [localItems, setLocalItems] = useState<Place[]>(places);
  const [isOptimizing, setIsOptimizing] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // Require a 5px drag to start
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  React.useEffect(() => {
    // Sync with external changes when not in editing mode
    if (!isEditing) {
      setLocalItems(places);
    }
  }, [places, isEditing]);

  const handleToggleEdit = () => {
    if (isEditing) {
      // When saving, call the callback to update the global state
      onOrderChange(localItems);
      setIsAdding(false); // Hide search bar on save
      setEditingItemId(null); // Reset editing item
    }
    setIsEditing(!isEditing);
  };

  const handleRemoveItem = (idToRemove: string) => {
    setLocalItems((currentItems) => currentItems.filter(item => item.id !== idToRemove));
  };

  function handleDragEnd(event: any) {
    const { active, over } = event;

    if (active.id !== over.id) {
      setLocalItems((currentItems) => {
        const oldIndex = currentItems.findIndex(item => item.id === active.id);
        const newIndex = currentItems.findIndex(item => item.id === over.id);
        return arrayMove(currentItems, oldIndex, newIndex);
      });
    }
  }

  // --- Search and Add new location logic ---
  const VIETMAP_API_KEY = process.env.NEXT_PUBLIC_VIETMAP_API_KEY;

  useEffect(() => {
    if ((!isAdding && editingItemId === null) || searchQuery.trim() === '') {
      setSuggestions([]);
      return;
    }

    const debounceTimeout = setTimeout(() => {
      fetch(`https://maps.vietmap.vn/api/autocomplete/v3?apikey=${VIETMAP_API_KEY}&text=${searchQuery}`)
        .then(response => response.json())
        .then(data => {
          setSuggestions(data);
        })
        .catch(error => console.error('Error fetching suggestions:', error));
    }, 300);

    return () => clearTimeout(debounceTimeout);
  }, [searchQuery, isAdding, editingItemId, VIETMAP_API_KEY]);

  const handleSuggestionClick = async (suggestion: any) => {
    setSearchQuery('');
    setSuggestions([]);
    
    const isUpdating = editingItemId !== null;

    if (suggestion.ref_id) {
      try {
        const response = await fetch(`https://maps.vietmap.vn/api/place/v4?apikey=${VIETMAP_API_KEY}&refid=${suggestion.ref_id}`);
        const data = await response.json();
        if (data && data.lat && data.lng) {
          // Check for duplicates before adding or updating
          const alreadyExists = localItems.some(
            item => item.lat === data.lat && item.lon === data.lng && item.id !== editingItemId
          );

          if (alreadyExists) {
            addToast('Địa điểm này đã có trong lộ trình của bạn.', 'warning');
            // If updating, we might want to reset the input to its original value or just leave it.
            // For now, we just stop the process.
            setEditingItemId(null);
            return;
          }

          const newPlace: Place = {
            id: isUpdating ? editingItemId! : uuidv4(),
            lat: data.lat,
            lon: data.lng,
            tags: {
              name: data.name,
              'name:vi': data.display,
            },
          };

          if (isUpdating) {
            setLocalItems(current => current.map(item => item.id === editingItemId ? newPlace : item));
            setEditingItemId(null);
          } else {
            setLocalItems(current => [...current, newPlace]);
            setIsAdding(false);
          }
        }
      } catch (error) {
        console.error('Error fetching place details:', error);
      }
    }
  };

  const handleItemNameChange = (id: string, newName: string) => {
    setLocalItems(current => current.map(item => {
      if (item.id === id) {
        setSearchQuery(newName); // Update search query as user types
        // Update both name fields to ensure the input can be cleared
        return { ...item, tags: { ...item.tags, 'name:vi': newName, name: newName } };
      }
      return item;
    }));
  };

  const handleItemFocus = (id: string) => {
    setEditingItemId(id);
    const item = localItems.find(i => i.id === id);
    if (item) {
      setSearchQuery(item.tags['name:vi'] || item.tags.name || '');
    }
  };

  const handleItemBlur = () => {
    // Use a timeout to allow click on suggestion list
    setTimeout(() => {
      setEditingItemId(null);
      setSuggestions([]);
    }, 200);
  };

  // --- End Search ---

  const optimizeRoute = async () => {
    if (localItems.length < 2) {
      addToast('Cần ít nhất 2 địa điểm để tối ưu hóa lộ trình.', 'warning');
      return;
    }

    setIsOptimizing(true);
    try {
      // Build coordinates string in format: lon,lat;lon,lat;...
      const coordinates = localItems.map(p => `${p.lon},${p.lat}`).join(';');
      const url = `https://router.project-osrm.org/trip/v1/driving/${coordinates}?source=first&roundtrip=false&overview=full`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.code === 'Ok' && data.waypoints && data.waypoints.length > 0) {
        // Reorder places based on waypoints returned from OSRM
        const optimizedOrder = data.waypoints.map((wp: any) => localItems[wp.waypoint_index]);
        setLocalItems(optimizedOrder);
        onOrderChange(optimizedOrder);
        addToast('Lộ trình đã được tối ưu hóa!', 'success');
      } else {
        addToast('Không thể tối ưu hóa lộ trình. Vui lòng thử lại.', 'danger');
      }
    } catch (error) {
      console.error('Error optimizing route:', error);
      addToast('Lỗi khi tối ưu hóa lộ trình.', 'danger');
    } finally {
      setIsOptimizing(false);
    }
  };

  function addLocation() {
    setIsAdding(true);
  }

  const itemIds = localItems.map(i => i.id);

  return (
    <div className={`bg-gray-100 rounded-lg shadow-lg transition-all duration-300 ${isOpen ? 'p-3 sm:p-4 w-full sm:w-96' : 'p-2 w-12'}`}>
        {isOpen ? (
          <>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-3 sm:mb-4">
                <div className="flex space-x-3 sm:space-x-4">
                    <button onClick={() => setSelectedVehicle('car')} className="p-1 hover:bg-white rounded transition">
                        <FontAwesomeIcon icon={faCar} className={`h-5 w-5 sm:h-6 sm:w-6 ${selectedVehicle === 'car' ? 'text-blue-500' : 'text-gray-500'}`} />
                    </button>
                    <button onClick={() => setSelectedVehicle('bike')} className="p-1 hover:bg-white rounded transition">
                        <FontAwesomeIcon icon={faBicycle} className={`h-5 w-5 sm:h-6 sm:w-6 ${selectedVehicle === 'bike' ? 'text-blue-500' : 'text-gray-500'}`} />
                    </button>
                    <button onClick={() => setSelectedVehicle('foot')} className="p-1 hover:bg-white rounded transition">
                        <FontAwesomeIcon icon={faWalking} className={`h-5 w-5 sm:h-6 sm:w-6 ${selectedVehicle === 'foot' ? 'text-blue-500' : 'text-gray-500'}`} />
                    </button>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                    {!isEditing && localItems.length > 1 && (
                        <button 
                            onClick={optimizeRoute}
                            disabled={isOptimizing}
                            className="bg-purple-500 hover:bg-purple-600 disabled:bg-purple-300 text-white px-2 sm:px-3 py-1 rounded-md text-xs sm:text-sm flex items-center gap-1 sm:gap-2 flex-1 sm:flex-none justify-center sm:justify-start"
                        >
                            <FontAwesomeIcon icon={faRobot} className="h-3 w-3 sm:h-4 sm:w-4" />
                            <span className="truncate">{isOptimizing ? 'Tối ưu...' : 'Tối ưu'}</span>
                        </button>
                    )}
                    <button onClick={handleToggleEdit} className="bg-blue-500 text-white px-2 sm:px-3 py-1 rounded-md text-xs sm:text-sm flex items-center gap-1 sm:gap-2 flex-1 sm:flex-none justify-center sm:justify-start">
                        <FontAwesomeIcon icon={isEditing ? faSave : faEdit} className="h-3 w-3 sm:h-4 sm:w-4" />
                        <span className="truncate">{isEditing ? 'Lưu' : 'Sửa'}</span>
                    </button>
                    <button 
                        onClick={() => setIsOpen(false)}
                        className="bg-gray-500 hover:bg-gray-600 text-white px-2 sm:px-3 py-1 rounded-md text-xs sm:text-sm flex items-center justify-center"
                        title="Đóng"
                    >
                        <FontAwesomeIcon icon={faChevronRight} className="h-3 w-3 sm:h-4 sm:w-4" />
                    </button>
                </div>
            </div>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
          {localItems.map((item, index) => {
            const isCurrentlyEditingThisItem = editingItemId === item.id;
            const displayName = item.tags['name:vi'] || item.tags.name;
            
            // If editing, show the exact value, even if empty. Otherwise, fallback to 'Unknown'.
            const label = isCurrentlyEditingThisItem ? (item.tags['name:vi'] ?? '') : (displayName || 'Unknown');

            return (
              <div 
                key={item.id}
                className="relative"
                onMouseEnter={() => onWaypointEnter(index)}
                onMouseLeave={onWaypointLeave}
              >
                <SortableItem 
                  id={item.id} 
                  label={label} 
                  isEditing={isEditing} 
                  onRemove={handleRemoveItem}
                  onNameChange={handleItemNameChange}
                  onFocus={handleItemFocus}
                  onBlur={handleItemBlur}
                />
                {editingItemId === item.id && suggestions.length > 0 && (
                   <div className="absolute top-full left-0 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg z-20">
                    {suggestions.map((suggestion, index) => (
                      <div
                        key={index}
                        className="p-2 hover:bg-gray-100 cursor-pointer"
                        onClick={() => handleSuggestionClick(suggestion)}
                      >
                        {suggestion.display}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </SortableContext>
      </DndContext>

      {isEditing && !isAdding && (
        <div className="mt-3 sm:mt-4">
          <button onClick={addLocation} className="flex items-center text-blue-500 text-sm hover:text-blue-700">
            <FontAwesomeIcon icon={faPlus} className="h-4 w-4 sm:h-5 sm:w-5 mr-1" />
            Add location
          </button>
        </div>
      )}
      {isEditing && isAdding && (
        <div className="mt-3 sm:mt-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Tìm kiếm địa điểm..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              autoComplete="off"
            />
            {suggestions.length > 0 && (
              <div className="absolute top-full left-0 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg z-20 max-h-60 overflow-y-auto">
                {suggestions.map((suggestion, index) => (
                  <div
                    key={index}
                    className="p-2 hover:bg-gray-100 cursor-pointer text-sm"
                    onClick={() => handleSuggestionClick(suggestion)}
                  >
                    {suggestion.display}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
          </>
        ) : (
          <button 
            onClick={() => setIsOpen(true)}
            className="bg-gray-500 hover:bg-gray-600 text-white px-2 py-2 rounded-md flex items-center justify-center"
            title="Mở"
          >
            <FontAwesomeIcon icon={faChevronLeft} className="h-4 w-4" />
          </button>
        )}
    </div>
  );
};

export default RoutePlanner;
