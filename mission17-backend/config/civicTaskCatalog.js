export const CIVIC_TASK_CATALOG = [
  {
    title: 'Proper Waste Segregation at Home',
    sdgNumber: 12,
    color: '#BF8B2E',
    imageFile: 'proper-waste-segregation.webp',
    description: `Sort one small batch of household waste into recyclables, biodegradable waste, and residual waste. Use the containers already available at home and wash your hands afterward.

Proof: Capture one clear, recent photo showing you actively sorting the waste. Do not include IDs, house numbers, private documents, or other people without their permission. Barangay staff will review the submission before recording your participation.`,
  },
  {
    title: 'Anti-Dengue Clean-Up Check',
    sdgNumber: 3,
    color: '#4C9F38',
    imageFile: 'anti-dengue-cleanup.webp',
    description: `Spend 10 to 15 minutes checking your home and yard for possible mosquito breeding sites. Empty and scrub containers with standing water, turn unused containers upside down, and keep stored water securely covered.

Proof: Capture one clear, recent photo showing one safe clean-up action. Do not use chemicals for the photo or expose IDs, house numbers, private documents, or other people without permission.`,
  },
  {
    title: 'Water Conservation at Home',
    sdgNumber: 6,
    color: '#26BDE2',
    imageFile: 'water-conservation.webp',
    description: `Complete one practical water-saving action at home, such as turning off the tap while soaping, collecting safe rinse water for plants or cleaning, or checking for an easy-to-fix leak. Avoid reusing contaminated water.

Proof: Capture one clear, recent photo showing the action without exposing IDs, house numbers, private documents, or other people without their permission.`,
  },
  {
    title: 'Home Emergency Readiness Check',
    sdgNumber: 13,
    color: '#3F7E44',
    imageFile: 'emergency-readiness.webp',
    description: `Prepare or check a basic household emergency kit. Include safe essentials available to you, such as drinking water, a flashlight, first-aid supplies, a whistle, a battery radio, rain protection, and a charged power bank.

Proof: Capture one clear, recent photo of the organized kit. Hide medicine labels, IDs, addresses, contact lists, and other private documents before taking the photo.`,
  },
  {
    title: 'Care for a Plant or Green Space',
    sdgNumber: 15,
    color: '#56C02B',
    imageFile: 'plant-care.webp',
    description: `Care for a plant in your home or an authorized shared space. Water it appropriately, remove dry leaves, loosen compacted soil, or add safe compost. Do not plant on roads, drainage paths, or private property without permission.

Proof: Capture one clear, recent photo showing you performing the activity. Avoid showing house numbers or other people without their permission.`,
  },
  {
    title: 'Keep Your Frontage Clean and Safe',
    sdgNumber: 11,
    color: '#FD9D24',
    imageFile: 'clean-frontage.webp',
    description: `Clean the safe walkway or frontage directly around your home. Sweep leaves, collect ordinary litter, and place the waste in the correct container. Do not enter a busy road, handle sharp or hazardous waste, or burn collected trash.

Proof: Capture one clear, recent photo showing the safe clean-up activity. Do not expose house numbers, private documents, or other people without permission.`,
  },
].map(task => ({ ...task, isActive: true }));
