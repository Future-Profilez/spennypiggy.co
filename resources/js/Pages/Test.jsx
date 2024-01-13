 
  import { DndContext, closestCenter } from '@dnd-kit/core';
  import { SortableContext, rectSortingStrategy, arrayMove } from '@dnd-kit/sortable';
  import { useEffect, useState } from 'react';
  import { useSortable } from '@dnd-kit/sortable';
  import { CSS } from '@dnd-kit/utilities';
  import axios from 'axios';
  
  export default function Test() {
  
    const post = () => { 
      axios.post(`say-thankyou/${payment_id}`, 
      {
         "messages":message,
         "message_media":msgMedia ? msgMedia : null
      }
      ).then(resp => {
           console.log("resp", resp)
      }).catch(_err => {
          console.error("error", _err);
      });
    }

    const get = () => { 
      axios.post(`say-thankyou/${payment_id}`).then(resp => {
           console.log("resp", resp)
      }).catch(_err => {
          console.error("error", _err);
      });
    }

    return (
      <>
        <button onClick={get} >Test Get Request</button>
        <button onClick={post} >Test Post Request</button>
      </>
    );
  }
  