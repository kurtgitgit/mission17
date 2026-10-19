export async function loadAnnouncementFeed(fetcher:(url:string)=>Promise<Response>,url:string,id?:string):Promise<{posts:any[];message:string}> {
  const response=await fetcher(url);if(!response.ok)throw new Error('Bulletins unavailable');
  const data=await response.json();if(!Array.isArray(data))throw new Error('Invalid bulletin response');
  if(!id||data.some(post=>post._id===id))return {posts:data,message:''};
  const detail=await fetcher(`${url}/${encodeURIComponent(id)}`);
  if(detail.status===404)return {posts:data,message:'This announcement is no longer available. It may have expired or been archived. Current bulletins are shown below.'};
  if(!detail.ok)return {posts:data,message:'The linked announcement could not be loaded. Please refresh to try again.'};
  return {posts:[await detail.json(),...data],message:''};
}
