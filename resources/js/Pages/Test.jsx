import { DndContext, closestCenter } from '@dnd-kit/core';
import{SortableContext,rectSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

export default function Test(){
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
      id:5
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


  const handleDragEnd = (event) => {
    const { active, over } = event;
    const activeIndex = languageImage.findIndex((item) => item.id === active.id);
    const overIndex = over ? languageImage.findIndex((item) => item.id === over.id) : -1;

    if (activeIndex !== overIndex) {
      const updatedLanguageImage = arrayMove(languageImage, activeIndex, overIndex, { key: 'id' });
      setLanguageImage(updatedLanguageImage);
    }
  };


  const Item = ({image}) =>{
    const { listeners, attributes, setNodeRef, transform } = useSortable({ id: image.id });
    const style = {
      transform: CSS.Translate.toString(transform)
    };
    return <div style={style} ref={setNodeRef} {...listeners} {...attributes}  className='items-flex-item' >{image.id}</div>
  }


  return <>
    <style>{`
      .items-flex-item{background:#ccc;max-width:25%;margin:20px;padding:20px;width:100%;}
      .items-flex{display:flex;flex-wrap:wrap;}
    `}</style>
  
    <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext strategy={rectSortingStrategy} items={languageImage}>
        <div className='items-flex'>
          {languageImage.map((m, i) => (
            <Item image={m} />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  </>
};
