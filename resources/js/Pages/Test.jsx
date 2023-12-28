 
  import { DndContext, closestCenter } from '@dnd-kit/core';
  import { SortableContext, rectSortingStrategy, arrayMove } from '@dnd-kit/sortable';
  import { useEffect, useState } from 'react';
  import { useSortable } from '@dnd-kit/sortable';
  import { CSS } from '@dnd-kit/utilities';
  import axios from 'axios';
  
  export default function Test() {

    const [languageImage, setLanguageImage] = useState([
      {
        id:1,
      },
      {
        id:2,
      },
      {
        id:3,
      },
      {
        id:4,
      },
      {
        id:5,
      },
      {
        id:6
      },
      {
        id:7
      },
      {
        id:8
      },
      {
        id:9
      },
      {
        id:10
      },
    ]);
  
    const [overIndex, setOverIndex] = useState(null);
  
    const handleDragEnd = (event) => {
      const { active, over } = event;
      const activeIndex = languageImage.findIndex((item) => item.id === active.id);
      const newOverIndex = over ? languageImage.findIndex((item) => item.id === over.id) : null;
  
      if (activeIndex !== newOverIndex) {
        const updatedLanguageImage = arrayMove(languageImage, activeIndex, newOverIndex, { key: 'id' });
        setLanguageImage(updatedLanguageImage);
      }
  
      setOverIndex(null);
    };
  
    const Item = ({ image }) => {
      const { listeners, attributes, setNodeRef, transform, isDragging } = useSortable({
        id: image.id,
        restrictToContainerEdges: true,
      });
  
      const style = {
        transform: CSS.Translate.toString(transform),
        // border: overIndex !== null ? '2px dashed #ffffff' : 'none',
      };
  
      return (
        <div
          style={style}
          ref={setNodeRef}
          {...listeners}
          {...attributes}
          className={`items-flex-item col-md-4 ${isDragging ? 'dragging' : ''}`}
        >
          {image.id}
        </div>
      );
    };
  
    return (
      <>
        <style>{`
          .items-flex-item {
            background: #ccc;
            margin: 20px;
            padding: 20px;
          }
          .items-flex {
            display: flex;
            flex-wrap: wrap;
          }
        
          .items-flex-item.dragging {
            border: 2px dashed #39f;
          }
          .items-flex> div:not(.dragging) { 
            transition:0.5s;
          }
        `}</style>
  
        <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext strategy={rectSortingStrategy} items={languageImage}>
            <div className='items-flex row'>
              {languageImage.map((m, i) => (
                <Item key={m.id} image={m} />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </>
    );
  }
  