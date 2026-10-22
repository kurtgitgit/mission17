// Resident-facing instructions grounded in the current mobile screens and API.
// Keep displayed UI labels in English in both languages so residents can find them.
const answers = {
  about: [
    'BrgyLink is the resident services app for Barangay Bagong Pag-asa. It supports document requests, blotter reports, private feedback, announcements, notifications, and the officials directory. I can explain these features, but I cannot submit, approve, or change records for you.',
    'Ang BrgyLink ay app para sa serbisyo ng Barangay Bagong Pag-asa: document requests, blotter reports, private feedback, announcements, notifications, at directory ng mga opisyal. Maaari ko pong ipaliwanag ang mga ito, pero hindi ako makakapagsumite, makakapag-approve, o makakapagbago ng records para sa iyo.',
  ],
  documents: [
    "To request a document, sign in and go to Home > 'Documents' > 'New Request'. Choose Barangay Clearance or the document you need; use 'Other Document' if it is not listed. Complete your name, address, contact number, and purpose, then submit. Track it in 'My Requests'. Check the News tab or the barangay office for current office requirements.",
    "Para humiling ng dokumento, mag-sign in at pumunta sa Home > 'Documents' > 'New Request'. Piliin ang Barangay Clearance o ang kailangan mong dokumento; piliin ang 'Other Document' kung wala sa listahan. Kumpletuhin ang name, address, contact number, at purpose, saka isumite. Subaybayan sa 'My Requests'. Tingnan ang News o magtanong sa barangay office para sa kasalukuyang requirements.",
  ],
  documentTypes: [
    "Home > 'Documents' > 'New Request' offers Barangay Clearance, Certificate of Indigency, Certificate of Residency, Business Clearance, Good Moral Certificate, Barangay Resident ID, Certificate of Tree Planting, First-Time Job Seeker Certificate, Oath of Undertaking, and Certificate of Low Income. Choose 'Other Document' for an unlisted request; issuance remains subject to barangay review.",
    "Sa Home > 'Documents' > 'New Request', may Barangay Clearance, Certificate of Indigency, Certificate of Residency, Business Clearance, Good Moral Certificate, Barangay Resident ID, Certificate of Tree Planting, First-Time Job Seeker Certificate, Oath of Undertaking, at Certificate of Low Income. Piliin ang 'Other Document' kung wala sa listahan; kailangan pa rin ng review ng barangay.",
  ],
  documentStatus: [
    "Sign in and go to Home > 'Documents' > 'My Requests'. Find the request and its reference number, status, pickup date if assigned, and any staff instructions. I cannot look up your private request in chat. Give the reference number only through an official barangay channel if you need help.",
    "Mag-sign in at pumunta sa Home > 'Documents' > 'My Requests'. Makikita ang reference number, status, pickup date kung mayroon, at staff instructions. Hindi ko po maaaring tingnan ang pribadong request mo rito sa chat. Ibigay lamang ang reference number sa opisyal na channel ng barangay kung kailangan ng tulong.",
  ],
  documentStatuses: [
    "In 'Documents' > 'My Requests': Pending means awaiting review; Processing means being handled; Ready for Pickup means prepared for collection; Completed means marked completed by staff; Rejected means not approved—read the reason and instructions. I cannot determine your personal status in chat.",
    "Sa 'Documents' > 'My Requests': Pending = naghihintay ng review; Processing = inaasikaso; Ready for Pickup = maaari nang kunin ayon sa instructions; Completed = minarkahang tapos ng staff; Rejected = hindi naaprubahan, kaya basahin ang reason at instructions. Hindi ko po nakikita rito ang personal mong status.",
  ],
  payment: [
    'Barangay Clearance costs ₱20 and Business Clearance costs ₱300. All other documents offered in BrgyLink are free. Payment for the two paid documents is made at Barangay Hall when you pick up your document. BrgyLink does not collect online payments. For accepted payment methods, please ask the barangay office.',
    'Ang Barangay Clearance ay ₱20 at ang Business Clearance ay ₱300. Lahat ng iba pang dokumento na inaalok sa BrgyLink ay libre. Sa Barangay Hall magbayad para sa dalawang dokumentong may bayad kapag pickup ng dokumento. Hindi tumatanggap ng online payment ang BrgyLink. Para sa paraan ng pagbabayad na tinatanggap, magtanong po sa barangay office.',
  ],
  requirements: [
    "The request form asks for the document type, complete name, address, Philippine mobile contact number, and purpose. For 'Other Document', also specify its name. These are app fields, not a complete official checklist. Please confirm supporting documents and eligibility with the barangay office; requirements depend on the document and purpose.",
    "Sa form, kailangan ang document type, complete name, address, Philippine mobile contact number, at purpose. Sa 'Other Document', ilagay din ang pangalan ng dokumento. App fields lamang ito, hindi kumpletong opisyal na checklist. Pakikumpirma po sa barangay office ang supporting documents at eligibility ayon sa dokumento at layunin.",
  ],
  pickup: [
    "Open 'Documents' > 'My Requests' and check for Ready for Pickup, the assigned pickup date, and barangay instructions. If no date is shown or you need to reschedule or authorize someone else, confirm with the barangay office before visiting. Payment, if applicable, is made at pickup. I cannot set or change the schedule here.",
    "Buksan ang 'Documents' > 'My Requests' at tingnan ang Ready for Pickup, pickup date, at instructions ng barangay. Kung walang date, kailangang mag-reschedule, o may ibang kukuha, pakikumpirma muna po sa barangay office. Ang payment, kung mayroon, ay sa pickup. Hindi ko kayang baguhin ang schedule dito.",
  ],
  documentRejected: [
    "Please open 'Documents' > 'My Requests' and read the rejection reason or missing-requirements instructions. Correct or provide what the barangay asks through the official process; contact the barangay office if the reason is unclear. I cannot approve the request or know its exact reason from chat.",
    "Buksan po ang 'Documents' > 'My Requests' at basahin ang reason ng rejection o missing-requirements instructions. Sundin ang hinihinging pagwawasto ng barangay sa opisyal na proseso. Kung hindi malinaw, makipag-ugnayan sa barangay office. Hindi ako makakapag-approve o makakaalam ng eksaktong dahilan dito sa chat.",
  ],
  processing: [
    "I cannot guarantee a document processing time or completion date. It depends on barangay review and requirements. Please monitor 'Documents' > 'My Requests' and the assigned pickup instructions, or contact the barangay office for your request's current schedule.",
    "Hindi ko po magagarantiya ang processing time o petsa ng pagtatapos ng dokumento. Depende ito sa review at requirements ng barangay. Tingnan ang 'Documents' > 'My Requests' at pickup instructions, o magtanong sa barangay office para sa kasalukuyang schedule ng request mo.",
  ],
  blotter: [
    "From Home, tap 'Blotter report' > 'File a Blotter Report'. Enter your name and contact number, incident type, location, actual incident date and time, and a clear narrative. The person's name and photo evidence are optional. Submit, then use the history icon or 'Track My Reports' to open 'My Blotter Reports'. For emergencies, call Home > Emergency Hotlines; BrgyLink cannot call or dispatch help.",
    "Mula Home, piliin ang 'Blotter report' > 'File a Blotter Report'. Ilagay ang pangalan at contact number, uri, lugar, aktuwal na petsa at oras, at malinaw na salaysay ng insidente. Optional ang pangalan ng taong sangkot at photo evidence. Isumite, at gamitin ang history icon o 'Track My Reports' para sa 'My Blotter Reports'. Kung emergency, tawagan ang nasa Home > Emergency Hotlines; hindi nakakatawag o nakakapagpadala ng tulong ang BrgyLink.",
  ],
  blotterStatus: [
    "Open Home > 'Blotter report', then the history icon or 'Track My Reports' > 'My Blotter Reports'. Pending awaits review; In Progress means approved for action; Resolved and Dismissed are final statuses. Read any case updates there. I cannot retrieve private case details or change a status in chat.",
    "Sa Home > 'Blotter report', gamitin ang history icon o 'Track My Reports' > 'My Blotter Reports'. Pending = naghihintay ng review; In Progress = aprubado para aksyunan; Resolved at Dismissed = final na status. Basahin doon ang updates. Hindi ko po kayang kunin ang pribadong case details o baguhin ang status sa chat.",
  ],
  followup: [
    'Follow-up Needed is a staff review outcome, not a resolved case. While Pending, staff records the needed follow-up before the Captain makes the initial decision. If approved for action, the case becomes In Progress and staff continues handling it. Check My Blotter Reports and follow official instructions; not every report needs a Lupon hearing.',
    'Ang Follow-up Needed ay review outcome ng staff, hindi pa resolved ang kaso. Habang Pending, itinatala ng staff ang kailangang follow-up bago ang unang desisyon ng Captain. Kapag aprubado para aksyunan, magiging In Progress at magpapatuloy ang staff handling. Tingnan ang My Blotter Reports at sundin ang opisyal na instructions; hindi lahat ng report ay kailangang dumaan sa Lupon hearing.',
  ],
  resolution: [
    'Filing a blotter does not automatically resolve it. Staff reviews the report; the Captain can approve it for action or dismiss it. For an In Progress case, staff records the outcome before the Captain makes the final resolve-or-dismiss decision. I cannot decide a case or give a legal ruling. Follow the official instructions in My Blotter Reports.',
    'Hindi automatic na resolved ang pagsumite ng blotter. May review ang staff at unang desisyon ang Captain kung aaksyunan o idi-dismiss. Sa In Progress na kaso, itinatala muna ng staff ang case outcome bago ang final resolve-or-dismiss decision ng Captain. Hindi ako makakapagdesisyon ng kaso o makakapagbigay ng legal ruling. Sundin ang instructions sa My Blotter Reports.',
  ],
  evidence: [
    'The blotter form allows an optional photo and an optional name of the person involved. If unknown, leave the name blank; do not invent details. Give a clear, factual narrative and the actual incident date, time, and location. Staff may request more information during review.',
    'Sa blotter form, optional ang photo at pangalan ng taong sangkot. Kung hindi alam, iwanang blangko ang pangalan; huwag mag-imbento ng detalye. Ilagay ang malinaw at totoong salaysay, at aktuwal na petsa, oras, at lugar. Maaaring humingi ang staff ng dagdag na impormasyon sa review.',
  ],
  feedback: [
    "For a service concern, suggestion, or broken streetlight, go to Home > 'eFeedback' > 'Write Message'. Choose a category, add a clear subject and detailed concern, then send. View status and the barangay reply in 'My Inbox & History'. For an incident needing a case record, use 'Blotter report' instead; chat itself does not submit either form.",
    "Para sa concern sa serbisyo, suhestiyon, o sirang ilaw, pumunta sa Home > 'eFeedback' > 'Write Message'. Pumili ng category, ilagay ang malinaw na subject at detalye, saka ipadala. Tingnan ang status at reply ng barangay sa 'My Inbox & History'. Para sa insidenteng kailangan ng case record, gamitin ang 'Blotter report'; hindi nagsusumite ng form ang chat.",
  ],
  anonymous: [
    "In 'eFeedback', enable 'Submit Anonymously' before sending. Your displayed identity is hidden from the officials' feedback view, but the system retains the account link so you can track your own message. This is not a promise of complete technical anonymity. Avoid unnecessary personal details in the message itself.",
    "Sa 'eFeedback', piliin ang 'Submit Anonymously' bago ipadala. Itinatago ang ipinapakitang identity sa feedback view ng mga opisyal, pero may account link pa rin sa system para masubaybayan mo ang sarili mong mensahe. Hindi ito garantiya ng ganap na technical anonymity. Iwasan ang di-kailangang personal na detalye sa mismong mensahe.",
  ],
  feedbackStatus: [
    "Open Home > 'eFeedback' > 'My Inbox & History'. Your feedback status and any barangay reply appear there. Statuses are New, Under Review, Resolved, and Dismissed. I cannot read private feedback, guarantee a response time, or reply on behalf of officials.",
    "Buksan ang Home > 'eFeedback' > 'My Inbox & History'. Doon makikita ang status at reply ng barangay kung mayroon. Ang mga status ay New, Under Review, Resolved, at Dismissed. Hindi ko po nababasa ang private feedback, magagarantiya ang oras ng sagot, o masasagot iyon sa ngalan ng mga opisyal.",
  ],
  notificationDelete: [
    'Open your notifications and tap the trash icon to choose which notifications to remove. Use Select all to select the current list, or Deselect all to clear your selection. Tap Delete selected and confirm. Unselected notifications stay. Deleting notifications does not delete your document requests, blotter reports, or account.',
    'Buksan ang notifications at i-tap ang trash icon para piliin ang mga gustong burahin. Gamitin ang Select all para piliin ang kasalukuyang listahan, o Deselect all para alisin ang pagkakapili. I-tap ang Delete selected at kumpirmahin. Mananatili ang hindi pinili. Hindi mabubura ang document requests, blotter reports, o account sa pagbura ng notifications.',
  ],
  notifications: [
    'Please check the app notification list first. For push alerts, check the push-notification setting in Settings and the notification permission for BrgyLink in your phone settings, then check your internet connection. Delivery is not guaranteed; you can still check request histories and News for updates. I cannot send an alert from chat.',
    'Pakitingnan muna po ang notification list sa app. Para sa push alerts, tingnan ang push setting sa Settings at notification permission ng BrgyLink sa phone settings, saka internet connection. Hindi garantisado ang delivery; makikita pa rin ang updates sa request histories at News. Hindi ako makakapagpadala ng alert mula sa chat.',
  ],
  registration: [
    'Use Create Account from the sign-in screen, complete the registration details and required ID, and verify your email with the code. Barangay staff reviews the profile and ID for approval before you can sign in. Email verification alone is not account approval. Never share your password or verification code in chat.',
    'Piliin ang Create Account sa sign-in screen, kumpletuhin ang registration details at ID, at i-verify ang email gamit ang code. May review ang barangay staff sa profile at ID para sa approval bago makapag-sign in. Ang email verification ay hindi pa account approval. Huwag ibahagi ang password o code dito sa chat.',
  ],
  approval: [
    'A pending registration still needs barangay review and approval of the profile and ID. Email verification does not replace that review. If rejected, follow the reason and correction instructions shown in the app. Please contact the barangay for account-specific help; I cannot approve an account or guarantee a review time.',
    'Ang pending registration ay kailangan pa ng review at approval ng barangay sa profile at ID. Hindi katumbas ng approval ang email verification. Kung rejected, sundin ang reason at correction instructions sa app. Makipag-ugnayan po sa barangay para sa account-specific help; hindi ako makakapag-approve o makakapangako ng oras ng review.',
  ],
  profile: [
    'Open Profile > Personal Information to view and manage the editable details, then save. Some verified identity or address changes may require barangay review or an office visit; follow the on-screen instructions. Do not send your ID, password, or full personal details to this chat.',
    'Buksan ang Profile > Personal Information para makita at baguhin ang editable details, saka i-save. Ang ilang verified identity o address changes ay maaaring kailangan ng review o pagpunta sa barangay; sundin ang instructions sa screen. Huwag ipadala rito ang ID, password, o buong personal na detalye.',
  ],
  passwordChange: [
    'To change a known password, open Profile > Security & Password and use Change Password in Settings. Follow the password rules and confirm with your current password. If you forgot it, use Forgot Password? on the sign-in screen instead. Never send passwords or reset links to this chat.',
    'Para palitan ang alam mong password, pumunta sa Profile > Security & Password at gamitin ang Change Password sa Settings. Sundin ang password rules at kumpirmahin gamit ang kasalukuyang password. Kung nakalimutan, gamitin ang Forgot Password? sa sign-in screen. Huwag ipadala ang password o reset link sa chat.',
  ],
  troubleshooting: [
    'I’m sorry you’re having trouble. Check your internet connection and try refreshing or reopening BrgyLink. Before submitting again, check the relevant request history to avoid duplicates after a timeout. If it persists, contact the barangay office with the screen and error message, without passwords or codes. I cannot verify server health from this chat.',
    'Pasensya na po sa abala. Tingnan ang internet connection at subukang i-refresh o buksan muli ang BrgyLink. Bago magsubmit again, tingnan muna ang request history para maiwasan ang duplicate matapos ang timeout. Kung tuloy pa rin, ibigay sa barangay office ang screen at error message, hindi password o code. Hindi ko nakukumpirma rito ang server health.',
  ],
  ledger: [
    'Open the BrgyLink website at /public-verify and enter the blotter reference number to check the public resolution record. When configured and successfully anchored, an integrity digest is recorded on Ethereum Sepolia, a test network—not the full private narrative or evidence. A resolved case does not by itself prove a successful blockchain transaction; read the portal result.',
    'Buksan ang /public-verify sa BrgyLink website at ilagay ang blotter reference number para sa public resolution record. Kapag configured at matagumpay ang pag-anchor, integrity digest ang nasa Ethereum Sepolia test network, hindi buong private narrative o evidence. Hindi garantiya ng blockchain transaction ang Resolved na status; basahin ang resulta sa portal.',
  ],
  clarify: [
    'Of course—could you tell me which service or request you mean: documents, a blotter report, feedback, or your account? Please describe the issue without sharing passwords, codes, or private case details.',
    'Sige po—alin o anong serbisyo ang tinutukoy mo: dokumento, blotter report, feedback, o account? Pakilinaw po ang kailangan nang hindi nagbabahagi ng password, code, o pribadong case details.',
  ],
  protectedAction: [
    'I can explain the steps, but I cannot submit, approve, reject, delete, or change your records from chat. Please use the relevant signed-in form or contact authorized barangay staff. Do not share passwords, codes, or private records here.',
    'Maaari ko pong ipaliwanag ang mga hakbang, pero hindi ako makakapagsumite, makakapag-approve, makakapag-reject, makakabura, o makakapagbago ng records sa chat. Gamitin ang tamang signed-in form o makipag-ugnayan sa awtorisadong staff. Huwag magbahagi ng password, code, o pribadong records dito.',
  ],
  announcementLocation: [
    'You can find barangay announcements in the News tab. You can also go to Home and choose Barangay Bulletins > See all.',
    'Makikita ang mga anunsyo sa News tab. Maaari ring pumunta sa Home at piliin ang Barangay Bulletins > See all.',
  ],
  announcementExpiry: [
    'An announcement or alert may stop appearing in the mobile feed when it expires, is archived, or is no longer active. Staff controls its publication period. Check News for current posts or ask the barangay office about an older notice; I cannot restore posts or confirm why a specific one disappeared.',
    'Maaaring mawala ang anunsyo o alert sa mobile feed kapag expired, naka-archive, o hindi na active. Staff ang nagtatakda ng publication period. Tingnan ang News para sa kasalukuyang posts o magtanong sa barangay office tungkol sa lumang notice; hindi ko kayang i-restore o kumpirmahin ang dahilan para sa isang partikular na post.',
  ],
  sentiment: [
    'Feedback sentiment labels—Positive, Neutral, or Negative—are automated indicators to support staff review. They are not a decision about whether your complaint is valid, and they may be mistaken. Your written concern and the officials’ review still matter. Check My Inbox & History for the actual status and reply.',
    'Ang sentiment labels na Positive, Neutral, o Negative ay automated indicators para makatulong sa review ng staff. Hindi ito desisyon kung valid ang reklamo at maaari itong magkamali. Mahalaga pa rin ang isinulat mong concern at review ng opisyal. Tingnan ang My Inbox & History para sa aktuwal na status at reply.',
  ],
  login: [
    'Please sign in with your registered email and password, checking typing and capitalization. If the email is already registered, use Sign In rather than creating another account; use Forgot Password? if needed. If your account is pending or rejected, follow the review instructions. Never share your password or verification code here.',
    'Gamitin po ang registered email at password sa Sign In at tingnan kung tama ang pag-type at capitalization. Kung registered na ang email, mag-Sign In sa halip na gumawa ng panibagong account; gamitin ang Forgot Password? kung kailangan. Kung pending o rejected, sundin ang review instructions. Huwag ibahagi ang password o code dito.',
  ],
  passwordRules: [
    'Use at least 8 characters with an uppercase letter, lowercase letter, number, and special character. Confirm the same password; when changing it, choose one different from your current and recently used passwords. Do not send your password to me.',
    'Gumamit po ng hindi bababa sa 8 characters na may uppercase letter, lowercase letter, numero, at special character. Dapat pareho ang confirmation; sa pagpapalit, pumili ng iba sa kasalukuyan at kamakailang ginamit na password. Huwag ipadala sa akin ang password.',
  ],
  mfa: [
    'Open Profile > Security & Password > Two-Factor Authentication in Settings. Residents can manage the available toggle; security requirements may be mandatory for official accounts. When a verification code is requested at sign-in, enter it only on the verification screen, never in chat.',
    'Pumunta sa Profile > Security & Password > Two-Factor Authentication sa Settings. Maaaring gamitin ng residente ang available na toggle; maaaring mandatory ang security requirement para sa official accounts. Ilagay lamang ang hinihinging sign-in verification code sa verification screen, hindi sa chat.',
  ],
  validation: [
    'Please follow the error beside each field. Use a valid 11-digit Philippine mobile number starting with 09. Document purpose needs 5–500 meaningful characters; blotter and feedback narratives need 10–500 in the mobile form, not numbers alone or repeated characters. For a blotter, select the actual incident date and time, not a future incident. Do not invent details just to pass validation.',
    'Sundin po ang error sa bawat field. Gumamit ng valid na 11-digit Philippine mobile number na nagsisimula sa 09. Ang document purpose ay 5–500 meaningful characters; blotter at feedback narrative ay 10–500 sa mobile form, hindi puro numero o paulit-ulit na characters. Sa blotter, piliin ang aktuwal na petsa at oras, hindi future incident. Huwag mag-imbento para lang pumasa sa validation.',
  ],
  documentChanges: [
    "For a submitted request, open 'Documents' > 'My Requests' and contact the barangay office about corrections, cancellation, or collection instructions. I cannot edit or cancel it in chat. Do not assume that a downloadable PDF is available: follow Ready for Pickup and the barangay pickup instructions.",
    "Para sa naisumiteng request, buksan ang 'Documents' > 'My Requests' at makipag-ugnayan sa barangay office para sa correction, cancellation, o collection instructions. Hindi ko kayang iedit o icancel sa chat. Huwag ipagpalagay na may downloadable PDF: sundin ang Ready for Pickup at pickup instructions ng barangay.",
  ],
  business: [
    "BrgyLink offers a Business Clearance request under Home > 'Documents' > 'New Request'. A barangay clearance is not the same as a complete business permit from other government offices. Please confirm the requirements and any additional permits with the barangay and the relevant office; I cannot guarantee eligibility or approval.",
    "May Business Clearance request sa Home > 'Documents' > 'New Request' ng BrgyLink. Hindi ito kapareho ng kumpletong business permit mula sa ibang government offices. Pakikumpirma po ang requirements at ibang permit sa barangay at kaukulang opisina; hindi ko magagarantiya ang eligibility o approval.",
  ],
};

const DOCUMENT = /\b(documents?|dokumento|dokumentong|clearance|certificates?|sertipiko|indigency|residency|good\s*moral|barangay\s+(?:resident\s+)?id|tree\s*planting|job\s*seeker|oath\s+of\s+undertaking|low\s+income)\b/i;
const BLOTTER = /\b(blotter|incident\s+reports?|report\s+(?:an?\s+)?incident|magrereklamo|case|kaso)\b/i;
const FEEDBACK = /\b(e\s*-?\s*feedback|feedback|suggestions?|suhestiyon|street\s*(?:light|lamp)|sirang\s+ilaw|concern)\b/i;
const ACCOUNT = /\b(account|registration|register|sign\s*-?\s*up|signup)\b/i;
const STATUS = /\b(status(?:es)?|track|tracking|subaybayan|reference|follow\s*-?\s*up|pending|processing|in\s+progress|resolved|dismissed|completed)\b/i;
const answer = (key, language) => answers[key][language === 'tagalog' ? 1 : 0];

export const getWorkflowReply = (message, language) => {
  if (!['english', 'tagalog'].includes(language)) return null;
  const hasDocument = DOCUMENT.test(message);
  const hasBlotter = BLOTTER.test(message);
  const hasFeedback = FEEDBACK.test(message);
  const hasAccount = ACCOUNT.test(message);
  let key;
  if (/\b(forgot|reset|nakalimutan)\b.{0,30}\bpassword\b|\botp\b|verification\s+code|(?:hindi|di).*dumating.*code/i.test(message)) return null;
  if (/\b(?:(?:can|could|would|will)\s+you\s+(?:please\s+)?|please\s+|mo\s+bang?\s+)(?:approve|iapprove|reject|delete|submit|isumite|baguhin)\b|\bpaki(?:submit|sumite|delete|approve)\b/i.test(message)) key = 'protectedAction';
  if (hasAccount && /\b(pending|reject\w*|approve|approval|iapprove)\b/i.test(message)) key = 'approval';
  if (!key && /\b(two[\s-]*factor|2fa|mfa)\b/i.test(message)) key = 'mfa';
  if (!key && /\bpassword\b/i.test(message) && /\b(rules?|requirements?|valid|strong|weak|characters?|anong)\b/i.test(message)) key = 'passwordRules';
  if (!key && /\b(email.*already\s+(?:registered|used|exists)|invalid\s+(?:login|credentials)|cannot\s+(?:log|sign)\s*in|can.t\s+(?:log|sign)\s*in|mali.*password|incorrect.*password)\b/i.test(message)) key = 'login';
  if (!key && hasAccount && /\b(upload|valid|verify|ID|identity)\b/i.test(message)) key = 'registration';
  if (!key && (hasDocument || hasBlotter || hasFeedback) && /\b(invalid|validation|characters?|description.*contain|incident\s+date|future|hindi\s+pwede)\b/i.test(message)) key = 'validation';
  if (!key && hasDocument && /\b(download|pdf|cancel|edit|iedit|icancel|correction)\b/i.test(message)) key = 'documentChanges';
  if (!key && /\bbusiness\s+permit\b/i.test(message)) key = 'business';
  if (!key && [hasDocument, hasBlotter, hasFeedback].filter(Boolean).length > 1 && /\b(and|also|at|pati)\b/i.test(message)) key = 'clarify';
  if (!key && /\b(timeout|timed\s*out|time\s*out|server|network|connection|offline|not\s+working|unavailable|ayaw|error|failed|failure|hindi\s+gumagana)\b/i.test(message)) key = 'troubleshooting';
  if (!key && /\b(blockchain|sepolia|ledger|public[\s/-]*verify)\b/i.test(message)) key = 'ledger';
  if (!key && /\b(announcements?|anunsyo|balita|alert|posts?)\b/i.test(message) && /\b(expir\w*|archiv\w*|disappear\w*|nawala|tinanggal|how\s+long)\b/i.test(message)) key = 'announcementExpiry';
  if (!key && /\b(announcements?|anunsyo|balita)\b/i.test(message) && /\b(where|find|saan|nasaan)\b/i.test(message)) key = 'announcementLocation';
  if (!key && /\bready\s+for\s+pick\s*up\b/i.test(message)) key = 'pickup';
  if (!key && /\bautomatic(?:ally)?\b.{0,30}\bresolved?\b/i.test(message)) key = 'resolution';
  if (!key && /\b(notifications?|notifikasyon|push\s+alerts?)\b/i.test(message)) key = /\b(delete|delet\w*|magdelete|burahin|bura|remove|clear)\b/i.test(message) ? 'notificationDelete' : 'notifications';
  if (!key && /\b(change|palitan|baguhin)\b.{0,20}\bpassword\b/i.test(message)) key = 'passwordChange';
  if (!key && /\b(profile|personal\s+information)\b/i.test(message)) key = 'profile';
  if (!key && /\b(change|update|edit|palitan|baguhin)\b.{0,35}\b(phone|mobile|contact|email|address|name|numero|pangalan|tirahan)\b/i.test(message)) key = 'profile';
  if (!key && hasAccount && /\b(register|create|make|gumawa|sign\s*-?\s*up|signup)\b/i.test(message)) key = 'registration';
  if (!key && hasFeedback) {
    key = /\b(sentiment|positive|neutral|negative)\b/i.test(message) ? 'sentiment'
      : /\b(anonymous|anonymously|anonimo|pangalan)\b/i.test(message) ? 'anonymous'
      : STATUS.test(message) || /\b(reply|response|sagot|inbox)\b/i.test(message) ? 'feedbackStatus' : 'feedback';
  }
  if (!key && hasBlotter) {
    key = /follow[\s-]*up\s+needed|follow[\s-]*up\s+(?:review|outcome)|(?:only\s+needs|kailangan\s+lang).*follow[\s-]*up/i.test(message) ? 'followup'
      : /\b(who\s+(?:resolves?|decides?)|sino.*(?:resolve|desisyon)|automatic(?:ally)?|outcome|lupon|hearing|mediation|conciliation|arbitration)\b/i.test(message) ? 'resolution'
        : /\b(evidence|photo|picture|respondent|nirereklamo|ebidensya)\b/i.test(message) ? 'evidence'
          : STATUS.test(message) ? 'blotterStatus' : 'blotter';
  }
  if (!key && hasDocument) {
    key = /\b(reject\w*|missing|kulang|denied)\b/i.test(message) ? 'documentRejected'
      : /\b(fee|fees|cost|price|payment|pay|how\s+much|bayad|magkano|gcash|libre|free)\b/i.test(message) ? 'payment'
        : /\b(how\s+long|processing\s+time|ilang\s+araw|gaano\s+katagal|guarantee|tomorrow|bukas)\b/i.test(message) ? 'processing'
          : /\b(pick\s*-?\s*up|pickup|collect|collection|kukunin|makukuha|kailan|reschedule)\b/i.test(message) ? 'pickup'
            : /\b(requirements?|information.*need|kailangan|supporting|eligib\w*)\b/i.test(message) && !/\b(?:kailangan\s+ko)\b/i.test(message) ? 'requirements'
              : /\b(documents?|certificates?|dokumento)\b/i.test(message) && /\b(available|which|types|list|anong\s+mga|mga\s+dokumento)\b/i.test(message) ? 'documentTypes'
                : /\b(mean|explain|ibig\s+sabihin|ano\s+ang\s+pending)\b/i.test(message) && STATUS.test(message) ? 'documentStatuses'
                  : STATUS.test(message) ? 'documentStatus' : 'documents';
  }
  if (!key && /\b(reklamo|complaint|magrereklamo)\b/i.test(message)) key = 'clarify';
  if (!key && /\b(?:what\s+is|what['’]s|tell\s+me\s+about|describe|explain)\s+(?:the\s+)?brgylink(?:\s+app)?[?.!\s]*$|\bwhat\s+(?:can|does)\s+(?:brgylink|the\s+app)\s+(?:help\s+me\s+)?do\b|\bbrgylink\s+(?:features|capabilities)\b|\bano\s+(?:ang\s+brgylink|(?:ang\s+)?magagawa\s+sa\s+brgylink)\b|\banong\s+features\s+ng\s+app\b/i.test(message)) key = 'about';
  if (!key && /^\s*(?:(?:how\s+much|requirements?|what\s+is\s+my\s+status|magkano|paano|pano)(?:\s+po)?)[?.!\s]*$/i.test(message)) key = 'clarify';
  return key ? answer(key, language) : null;
};

// A classifier may select an answer, but its prose is not a factual source.
// Subject checks stop a confident wrong intent from inventing local policy.
export const getClassifiedWorkflowReply = (message, { intent, confidence }, language) => {
  if (typeof confidence !== 'number' || !Number.isFinite(confidence) || confidence < 0.6) return null;
  const candidates = {
    registration: [ACCOUNT, 'registration'], account_help: [ACCOUNT, 'approval'],
    document_request: [DOCUMENT, 'documents'], document_status: [DOCUMENT, 'documentStatus'],
    blotter_status: [BLOTTER, 'blotterStatus'], report_incident: [BLOTTER, 'blotter'],
    suggestion: [FEEDBACK, 'feedback'], notifications: [/\b(notifications?|notifikasyon)\b/i, 'notifications'],
  };
  const candidate = Object.hasOwn(candidates, intent) ? candidates[intent] : null;
  return candidate?.[0].test(message) && ['english', 'tagalog'].includes(language) ? answer(candidate[1], language) : null;
};
