export function createLatestRequest() {
  let generation=0;
  return {begin:()=>++generation,isCurrent:request=>request===generation,invalidate:()=>{generation++;}};
}
