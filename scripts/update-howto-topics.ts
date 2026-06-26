import fs from "node:fs";
import path from "node:path";
import { createStep, createTip, serializeHowToContent } from "../lib/howto-content";

const seedPath = path.join(process.cwd(), "data/helix-howto-seed.json");
const seed = JSON.parse(fs.readFileSync(seedPath, "utf-8")) as {
  entries: { question: string; answer: string; updatedAt: string }[];
  updatedAt: string;
};

const updates: Record<string, { steps: string[]; tips: string[] }> = {
  "18.": {
    steps: [
      "Tap 'Explore' then tap the 'External' tab.",
      "Browse the list of external facility roles (mostly the Transfer Centers of other hospitals).",
      "Or type a facility name or role in the search bar.",
      "Tap any external role to see its description and contact options.",
      "Tap 'Message Role' to send a secure message to that external facility.",
      "Tap 'Request Transfer' to initiate a patient transfer request with the other facility.",
      "All external messaging remains encrypted and Data Compliant.",
    ],
    tips: [
      "Use the External tab to reach transfer centers when arranging patient transfers to other hospitals.",
    ],
  },
  "19.": {
    steps: [
      "Tap 'Explore' in the bottom navigation bar, then tap the 'External' tab.",
      "Browse or search for the Transfer Center of the receiving facility (e.g., XYZ Transfer Center or BRH Transfer Center).",
      "Tap the Transfer Center to open its External Contact page - you will see the facility name, department, and priority level listed under Details.",
      "You will see two options - tap 'Request Transfer' to use the structured transfer form or tap 'Message' to send a direct message to the transfer center.",
      "If using 'Request Transfer', a form will appear pre-addressed to the receiving Transfer Center. Fill in the following:",
      "Send as: The Sender is prefilled as you.",
      "Requesting Physician: Tap '+ Add Physician' to add the requesting physician's name.",
      "Patient Details: Enter the patient's First Name, Last Name, Date of Birth, Gender, and Primary Diagnosis.",
      "Transfer Details: Enter the reason for transfer.",
      "Additional Information: Add any optional supporting notes.",
      "Use the toolbar at the bottom to attach documents or media files (+), add a voice note, or flag the request as critical (⚠️) if the transfer is urgent.",
      "Tap 'Send' to submit the transfer request - it will be routed to whoever is on duty at the receiving Transfer Center.",
      "Await confirmation of bed availability and acceptance via HELIX message.",
      "Document the transfer communication in the patient's care record as appropriate.",
    ],
    tips: [
      "HELIX creates a full audit trail of all transfer communications including who sent the request, when it was delivered, and when it was acknowledged - which can be referenced for compliance and handover purposes. If a Transfer Center is classified as a Critical Priority role. If the transfer is urgent, tap the ⚠️ symbol before sending to flag it as a critical message, ensuring immediate escalation if unacknowledged.",
    ],
  },
  "20.": {
    steps: [
      "Tap 'Patients' in the bottom navigation bar.",
      "The 'My Patients' tab (default) shows all patients currently assigned to you.",
      "Each entry shows the patient's name, age, sex, room number, unit, bed and assigned care team.",
      "Tap any patient name to open their detail view.",
      "Use the 'Saved' tab to access bookmarked patients.",
      "Use the 'All Patients' tab to search the full facility patient list sorted into Units.",
    ],
    tips: [],
  },
  "21.": {
    steps: [
      "Tap 'Patients' then tap the '+' icon in the top right corner.",
      "Enter the patient's full details as required.",
      "Tap 'Save' to create the patient record.",
    ],
    tips: [
      "Patient records created in HELIX are for care coordination purposes. Always ensure data is consistent with your EMR.",
    ],
  },
  "22.": {
    steps: [
      "Tap 'Patients' in the bottom navigation bar.",
      "Search for the patient by name using the search bar, or browse the patient list each entry shows the patient's name, age, sex, room, bed, and ward/unit (e.g., ICU West, Medical Ward, Pediatric OPD).",
      "Tap the patient's name to open their profile page.",
      "You will see the patient's Location Details (Room & Bed, Unit) and a Care Team section below showing the current number of members.",
      "If no care team has been assigned yet, the Care Team section will show '0 Members' and the 'Message Care Team' button will appear greyed out.",
      "Tap the '+' button next to the Members count to begin adding team members.",
      "An 'Add to Care Team' search screen will appear - search by name, specialty, or department to find the provider you want to add (e.g., Dr. Badu, Simon-Neurology & Neurosurgery · Consultant).",
      "Tap on a provider's name to select them - you can add multiple members one after another.",
      "Tap the ✓ (checkmark) in the top right corner to confirm and save the care team.",
      "The Care Team section will now display all added members with their role and the time they joined (e.g., Resident | Joined Just now).",
    ],
    tips: [],
  },
  "23.": {
    steps: [
      "Once members are added, tap the ⋮ (three-dot menu) next to any team member to access the following options:",
      "Message-Send a direct message to that team member.",
      "Remove from team-Remove them from the patient's care team.",
      "Make attending physician-Designate them as the lead physician for this patient.",
      "Make first contact-Set them as the primary point of contact for this patient.",
      "Once the care team has at least one member, tap 'Message Care Team' to open the shared care team group chat for that patient.",
    ],
    tips: [
      "Always build the care team as soon as a patient is admitted so all providers are connected from the start and no communication is missed. The care team chat is automatically linked to the patient's profile - all messages, updates, and shared documents within it are tied to that patient's record for easy reference and audit.",
    ],
  },
  "24.": {
    steps: [
      "On the Home screen, tap the '+' button next to 'View all' in the Broadcasts section.",
      "Enter a title for the broadcast (e.g., 'ED at Capacity').",
      "Type the full message body with relevant details.",
      "Select the recipients: all staff (everyone), specific departments, or selected roles.",
      "Review the broadcast before sending.",
      "Tap 'Send'-all selected recipients receive an immediate push notification.",
    ],
    tips: [
      "Keep broadcast messages concise and action oriented. Avoid sending non-urgent information as a broadcast.",
    ],
  },
  "25.": {
    steps: [
      "On the Home screen, tap the large 'Code Blue' button at the top of the screen.",
      "A confirmation dialog will appear -it includes a location field, enter or confirm the location of the emergency.",
      "HELIX immediately sends an alert to all members of the resuscitation team per your facility's protocol.",
      "The alert is logged with a timestamp and the identity of who activated it.",
      "All recipients will receive a high-priority push notification and in-app alert.",
    ],
    tips: [
      "The Code Blue button is designed for immediate one-tap activation. Familiarize yourself with its location before an emergency occurs.",
    ],
  },
  "26.": {
    steps: [
      "On the Home screen, tap 'View all' next to the Broadcasts section.",
      "Alternatively, navigate to the Broadcasts screen from the menu.",
      "Tap 'Received' to see all broadcasts sent to you.",
      "Tap 'Sent' to see all broadcasts you have previously sent.",
      "Tap any broadcast to read the full message and see who read the broadcast.",
      "Use the search bar to find a specific broadcast by keyword.",
    ],
    tips: [],
  },
  "27.": {
    steps: [
      "On the Home screen, scroll down to the Notifications section.",
      "Tap 'View all' to see the complete notifications feed.",
      "Notifications include role sign-in/out events, shared reminders, escalation alerts, and system updates.",
      "Unread notifications are highlighted-tap to mark them as read.",
    ],
    tips: [],
  },
  "28.": {
    steps: [
      "From the Home screen, tap the wrench/tools icon near your name in the top right corner.",
      "A Tools menu will appear at the bottom of the screen with two options - tap 'Reminders'.",
      "The Reminders screen will open, showing tabs for All, Upcoming, and Past reminders.",
      "Tap the '+' icon in the top right corner to create a new reminder.",
      "A 'New Reminder' form will appear. Fill in the following:",
      "Title - Enter a short title for the reminder (e.g., 'Review patient discharge summary').",
      "Description - Add any additional details or notes about the reminder.",
      "Due -Tap the date and time fields to set when the reminder is due.",
      "Repeat -Tap to set a repeat frequency (e.g., Never, Daily, Weekly) if the reminder is recurring.",
      "Early Alert- Tap to choose how far in advance you want to be notified: Off (notify at due time only), 5 minutes before, 10 minutes before, 15 minutes before, 30 minutes before, or 1 hour before.",
      "Leave Share set to 'Only you' for a personal reminder.",
      "Tap the ✓ (checkmark) in the top right corner to save the reminder.",
      "HELIX will send you a push notification at the scheduled time.",
    ],
    tips: [
      "Use the Upcoming tab to see all reminders that haven't triggered yet, and the Past tab to review reminders that have already been delivered.",
    ],
  },
  "29.": {
    steps: [
      "Follow steps 1–5 above to create a new reminder and fill in the Title, Description, Due date/time, Repeat, and Early Alert settings.",
      "Before saving, tap the 'Share' field-it will show 'Only you' by default.",
      "A Share screen will appear with a searchable list of all staff (People and Roles).",
      "Search for and tap the name(s) of the colleague(s) you want to share the reminder with.",
      "You can add multiple people - each new invitee defaults to View only access.",
      "Tap the ✓ (checkmark) in the top right to confirm your selections and return to the reminder form.",
      "Tap the ✓ (checkmark) again at the top of the New Reminder screen to save and send.",
      "All selected colleagues will receive the reminder notification at the set time on their devices.",
    ],
    tips: [],
  },
  "30.": {
    steps: [
      "When you send a critical message to a role with an Escalation ladder, HELIX monitors whether the recipient acknowledges it.",
      "If there is no acknowledgment within the configured timeout (e.g., 2 minutes), HELIX escalates automatically.",
      "Escalation routes the message to the next person in the configured escalation chain (e.g., supervisor or backup on-call).",
      "Each escalation step is logged with the timestamp and the recipient at each level.",
      "Escalation continues until someone acknowledges the message.",
      "The original sender is notified when the message has been acknowledged and by whom.",
    ],
    tips: [
      "Admins will configure escalation chains in advance for each department to ensure critical alerts always reach someone.",
    ],
  },
  "31.": {
    steps: [
      "When a critical alert arrives, your device will sound loudly and/or vibrate and display a high-priority push notification.",
      "You can access HELIX by tapping on the notification or open HELIX and navigate to the message.",
      "Read the alert carefully.",
      "Press and hold the message and a dialogue will pop up with the option to 'Acknowledge' the message to confirm you have received and noted it.",
      "Your acknowledgment is logged with your name and a timestamp.",
      "If applicable, reply with your intended action (e.g., 'On my way').",
      "Failure to acknowledge within the timeout window will trigger escalation to the next provider or supervisor if you are logged into a role. If it is a personal message, the alert will ring until you acknowledge the message.",
    ],
    tips: [],
  },
  "32.": {
    steps: [
      "From the Home screen, tap your profile photo in the top right corner.",
      "Your profile page will open showing your full details - name, qualification, Employee ID, username, email, and phone number.",
      "If your phone number shows 'Not verified - tap to verify' in red, tap it to complete phone verification for your account.",
      "Scroll down to the Activity section where you can access Reminders (view and manage all your personal and shared reminders) and Signing History (see a full log of your recent role sign-ins and sign-outs).",
      "Tap 'Settings' (Privacy, app lock, and visibility) to open the Settings screen.",
      "From the Settings screen, configure the following:",
      "Status - Do Not Disturb: Toggle on to pause incoming message notifications. When active, no standard message notifications will be delivered until it is turned off.",
      "Security - App Lock: Toggle on to require a PIN or biometric (Face ID / fingerprint) every time the app is opened, adding an extra layer of protection.",
      "Change Password: Tap to update your HELIX sign-in password.",
      "Notifications - Hide Message Preview: Toggle on to hide message content from appearing on your lock screen notifications.",
      "Profile Visibility - Show email to others: Toggle on or off to control whether colleagues can see your email address when viewing your profile.",
      "Show phone to others: Toggle on or off to control whether colleagues can see your phone number when viewing your profile.",
      "About - App & Device: Tap to view your current app version, build number, and device details. Share this information with Helix Health support when reporting a technical issue.",
    ],
    tips: [
      "If you are unsure whether your device will receive critical alerts, use 'Send test critical notification' to verify before your shift begins especially after changing any notification or DND settings on your phone.",
    ],
  },
  "33.": {
    steps: [
      "Tap your profile icon from the Home screen.",
      "Go to 'Settings' then 'Security'.",
      "Tap 'Change Password'.",
      "Enter your current password.",
      "Enter your new password.",
      "Re-enter the new password to confirm.",
      "Tap 'Update' - you will need to log in again on all devices with the new password.",
    ],
    tips: [],
  },
  "34.": {
    steps: [
      "From the Home screen, tap your profile photo in the top right corner.",
      "Scroll to the bottom of your profile page. You will see three options:",
      "Switch Account - Tap to switch between multiple HELIX accounts on the same device (e.g., if you manage accounts across more than one facility).",
      "Sign out of all roles - Tap to immediately end your shift and release all active roles you are currently covering. This does not log you out of the app -you remain signed in but are no longer the active responder for any role.",
      "Logout (shown in red) - Tap to fully sign out of HELIX on this device. You will need to enter your credentials to log back in.",
      "For 'Sign out of all roles', confirm the action when prompted - all roles will be released simultaneously, and the Roles Directory will update immediately.",
      "For 'Logout', confirm the action - you will be signed out of the app immediately on this device only. Other devices where you are logged in will remain active.",
    ],
    tips: [
      "Use 'Sign out of all roles' at the end of your shift if you want to stop receiving role-based messages but keep the app open. Use 'Logout' only when you are finished using the device entirely.",
    ],
  },
  "35.": {
    steps: [
      "Tap your profile icon on the Home screen.",
      "Scroll to the bottom of the profile menu.",
      "Tap 'Logout' (shown in red).",
      "Confirm the action -you will be signed out of the app immediately.",
      "No sensitive data remains on the device after logout.",
      "If you are covering a role, ensure you transfer role coverage before logging out.",
    ],
    tips: [
      "Always log out of HELIX when using a shared or borrowed device.",
    ],
  },
  "36.": {
    steps: [
      "All messages sent through HELIX are encrypted end-to-end using industry-standard protocols.",
      "Data is encrypted both in transit (while being sent) and at rest (while stored on servers).",
      "Encryption keys are managed by Helix Health Technologies' secure infrastructure.",
      "No third party (including mobile carriers or internet providers) can read your HELIX messages.",
      "Patient data shared within HELIX conversations is protected under Data Protection storage policies.",
      "For a detailed technical security overview, contact info@helixhealth.app.",
    ],
    tips: [],
  },
  "37.": {
    steps: [
      "Ensure you are entering the correct email address and password.",
      "Check that your internet connection is active.",
      "If you have forgotten your password, tap 'Forgot Password' on the login screen and follow the email reset instructions.",
      "If your account has been deactivated, contact your HELIX facility admin.",
      "If none of the above work, uninstall and reinstall the HELIX app.",
      "For persistent login issues, contact Helix Health support at support@helixhealth.app or +233 54 357 1525.",
    ],
    tips: [],
  },
};

const now = new Date().toISOString();

for (const [prefix, data] of Object.entries(updates)) {
  const entry = seed.entries.find((item) => item.question.startsWith(prefix));
  if (!entry) {
    console.error(`Topic not found: ${prefix}`);
    process.exit(1);
  }

  entry.answer = serializeHowToContent({
    steps: data.steps.map((text) => createStep(text)),
    tips: data.tips.map((text) => createTip(text)),
  });
  entry.updatedAt = now;

  const content = JSON.parse(entry.answer) as { steps: unknown[]; tips: unknown[] };
  console.log(
    `${entry.question} — ${content.steps.length} steps, ${content.tips.length} tip(s)`,
  );
}

seed.updatedAt = now;
fs.writeFileSync(seedPath, JSON.stringify(seed, null, 2));
console.log("\nSeed file updated.");
