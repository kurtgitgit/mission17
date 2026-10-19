// Legacy records without this field are current; all is only used by protected admin lists.
export const archiveFilter = view => view === 'all' ? {} : { isArchived: view === 'archived' ? true : { $ne: true } };
