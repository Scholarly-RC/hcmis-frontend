export type DocCategoryId =
  | "overview"
  | "getting-started"
  | "employee-features"
  | "approvals-and-workflows"
  | "hr-and-admin-features"
  | "payroll-features"
  | "attendance-and-biometric"
  | "troubleshooting";

export type DocSection = {
  title: string;
  paragraphs?: string[];
  bullets?: string[];
};

export type DocTask = {
  title: string;
  intro?: string;
  steps: string[];
  outcome?: string;
  notes?: string[];
};

export type DocPage = {
  slug: string[];
  title: string;
  description: string;
  categoryId: DocCategoryId;
  audience: string;
  summary: string;
  tasks?: DocTask[];
  sections: DocSection[];
  related: string[][];
};

export type DocCategory = {
  id: DocCategoryId;
  title: string;
  description: string;
};

const categories = [
  {
    id: "overview",
    title: "Overview",
    description:
      "Start here for a high-level view of HCMIS and its public help pages.",
  },
  {
    id: "getting-started",
    title: "Getting Started",
    description:
      "Basic account, sign-in, dashboard, profile, and notification guidance.",
  },
  {
    id: "employee-features",
    title: "Employee Features",
    description: "Public help pages for day-to-day self-service workflows.",
  },
  {
    id: "approvals-and-workflows",
    title: "Approvals And Workflows",
    description:
      "How request reviews, approvals, and statuses work across modules.",
  },
  {
    id: "hr-and-admin-features",
    title: "HR And Admin Features",
    description:
      "Public-safe explanations for HR workspaces and management screens.",
  },
  {
    id: "payroll-features",
    title: "Payroll Features",
    description:
      "Public-safe guides for payroll visibility and payroll administration pages.",
  },
  {
    id: "attendance-and-biometric",
    title: "Attendance And Biometric",
    description:
      "Attendance concepts and public-safe biometric synchronization guidance.",
  },
  {
    id: "troubleshooting",
    title: "Troubleshooting",
    description:
      "Common user-facing issues, status confusion, and when to contact HR or support.",
  },
] as const satisfies readonly DocCategory[];

const pages = [
  {
    slug: [],
    title: "HCMIS Overview",
    description:
      "Public product documentation for employee, approver, HR, and biometric workflows.",
    categoryId: "overview",
    audience: "All visitors",
    summary:
      "Use this hub to understand what each HCMIS module is for, who normally uses it, and where to start before signing in.",
    sections: [
      {
        title: "Purpose",
        paragraphs: [
          "HCMIS brings common employee and HR workflows into one application. The current product surface includes attendance, leave, overtime, official business, certificate requests, payroll visibility, request approvals, and HR administration workspaces.",
          "This public documentation is written as a help center. It explains what each page does, what users can expect from the workflow, and how statuses typically move, without exposing internal-only operational details.",
        ],
      },
      {
        title: "Main Module Areas",
        bullets: [
          "Getting Started covers sign-in, dashboard behavior, profile updates, password changes, and notifications.",
          "Employee Features covers the day-to-day pages most employees use to submit or track their own records and requests.",
          "Approvals And Workflows explains the shared approval model used by leave, overtime, official business, and certificate requests.",
          "HR And Admin Features describes management screens in public-safe terms, focusing on what administrators can do from each page.",
          "Attendance And Biometric explains attendance concepts and the app-facing biometric synchronization workflow.",
        ],
      },
      {
        title: "How To Use This Help Center",
        bullets: [
          "Start with Getting Started if you are new to the product or need to confirm where a feature lives.",
          "Open the specific feature page when you need the allowed actions, key fields, and common status meanings for one screen.",
          "Use the workflow pages when you need to understand why a request is pending, who can act on it, or what approval outcomes mean.",
        ],
      },
    ],
    related: [
      ["getting-started", "login"],
      ["getting-started", "dashboard"],
      ["workflows", "approvals-overview"],
      ["workflows", "status-guide"],
    ],
  },
  {
    slug: ["getting-started", "login"],
    title: "Login",
    description: "Access HCMIS using the public sign-in page.",
    categoryId: "getting-started",
    audience: "All visitors",
    summary: "Use this page to sign in to HCMIS.",
    tasks: [
      {
        title: "How to sign in",
        intro:
          "Use these steps whenever you need to enter HCMIS from the public sign-in page.",
        steps: [
          "Open the HCMIS login page.",
          "Enter your account value in `Email or Username`.",
          "Enter your password in `Password`.",
          "If needed, click the eye icon to show or hide the password before submitting.",
          "Click `Sign In`.",
        ],
        outcome:
          "HCMIS redirects you to `Dashboard` for normal access or to `Change Password` if your account requires a password update first.",
      },
    ],
    sections: [
      {
        title: "How To Access It",
        paragraphs: [
          "Open the public sign-in screen at the HCMIS login route. If you already have a valid session, HCMIS sends you directly to your dashboard instead of showing the form again.",
          "If your account is flagged for a mandatory password update, the sign-in flow sends you to the Change Password page before allowing normal dashboard access.",
        ],
      },
      {
        title: "What Happens After Sign-In",
        bullets: [
          "Valid credentials open your HCMIS session.",
          "Users with a required password reset are redirected to Change Password.",
          "Users with a normal account state are redirected to Dashboard.",
        ],
      },
      {
        title: "Common Issues",
        bullets: [
          "If the page keeps sending you back to sign-in, your session may have expired.",
          "If HCMIS sends you to `Change Password`, your account must update its password before normal use.",
          "If sign-in fails, share the exact error message with HR or support.",
        ],
      },
    ],
    related: [
      ["getting-started", "dashboard"],
      ["getting-started", "change-password"],
    ],
  },
  {
    slug: ["getting-started", "dashboard"],
    title: "Dashboard",
    description:
      "Role-based landing page that surfaces metrics, next actions, and recent updates.",
    categoryId: "getting-started",
    audience: "Signed-in users",
    summary: "Dashboard is your starting page after sign-in.",
    tasks: [
      {
        title: "How to use Dashboard to open your next task",
        steps: [
          "Sign in and wait for HCMIS to open `Dashboard`.",
          "Review the metric cards at the top such as `Leave Balance`, `Pending Requests`, or `Today's Attendance`.",
          "Use the quick action cards to open pages like `Leave`, `Overtime`, `My Payslips`, or `Request Inbox`.",
          "Check the task list for items that still need action.",
        ],
        outcome:
          "You can move from the landing page directly into the module that needs your attention.",
      },
      {
        title: "How to review published updates from Dashboard",
        steps: [
          "Open `Dashboard`.",
          "Scroll to the employee updates area.",
          "Review the latest published announcement or poll cards.",
          "Open the linked page if you need to read the full item or participate.",
        ],
      },
    ],
    sections: [
      {
        title: "What You Can Expect",
        paragraphs: [
          "Employees usually see shortcuts for attendance, leave, overtime, payslips, and other personal tasks.",
          "HR users usually see shortcuts for approvals, payroll work, and management pages.",
        ],
      },
      {
        title: "Typical Actions",
        bullets: [
          "Open personal pages such as Leave, Overtime, My Payslips, or Performance Evaluations.",
          "Review task cards that call out pending approvals or unreleased payroll actions.",
          "Read employee-facing updates surfaced through the announcements and polls feed.",
        ],
      },
      {
        title: "Notes About Role Differences",
        bullets: [
          "Not every user sees the same dashboard.",
          "If a page in the docs is missing from your dashboard or sidebar, your account may not have access to it.",
        ],
      },
    ],
    related: [
      ["getting-started", "profile"],
      ["employee", "attendance"],
      ["workflows", "request-inbox"],
    ],
  },
  {
    slug: ["getting-started", "profile"],
    title: "Profile",
    description:
      "View your account and employment details and update the fields that are exposed for editing.",
    categoryId: "getting-started",
    audience: "Employees, approvers, and admins",
    summary:
      "Profile combines identity details, read-only employment information, training history, and account security controls.",
    tasks: [
      {
        title: "How to update your profile",
        steps: [
          "Open `Profile` from the main application navigation.",
          "Review the `Profile details` section to confirm the existing values.",
          "Open the profile edit dialog from the page action area.",
          "Update the fields that are available for self-service editing.",
          "Save the changes in the dialog.",
        ],
        outcome: "Your editable profile fields are updated in HCMIS.",
      },
      {
        title: "How to change your password from Profile",
        steps: [
          "Open `Profile`.",
          "Scroll to the `Security` section.",
          "Enter the required password fields in the change password form.",
          "Submit the form.",
        ],
        outcome: "Your password changes without leaving the profile page.",
      },
    ],
    sections: [
      {
        title: "What You Can Do Here",
        bullets: [
          "Review your profile record and visible employment details.",
          "Open the edit dialog for profile fields that are available for self-service updates.",
          "Review completed trainings that are associated with your account.",
          "Change your password from the Security section without leaving the profile page.",
        ],
      },
      {
        title: "Key Sections",
        bullets: [
          "Profile Header summarizes your main account identity.",
          "Profile Details shows record fields that are stored for your account.",
          "Completed Trainings lists training history connected to your user profile.",
          "Security lets you change your password directly from the page.",
        ],
      },
      {
        title: "Common Issues",
        bullets: [
          "Some fields may appear read-only because they are sourced from managed employee records rather than self-service data.",
          "If a required update cannot be made from the edit dialog, escalate it through the appropriate HR contact instead of assuming the value is user-editable.",
        ],
      },
    ],
    related: [
      ["getting-started", "change-password"],
      ["getting-started", "dashboard"],
    ],
  },
  {
    slug: ["getting-started", "change-password"],
    title: "Change Password",
    description:
      "Update your account password when prompted or from your profile security section.",
    categoryId: "getting-started",
    audience: "Signed-in users",
    summary:
      "HCMIS supports both forced password changes after sign-in and optional password changes from the profile page.",
    tasks: [
      {
        title: "How to complete a required password change",
        steps: [
          "Sign in with your current credentials.",
          "If HCMIS redirects you to `Change Password`, stay on that page.",
          "Enter the required password fields.",
          "Submit the form.",
        ],
        outcome:
          "Your password is updated and HCMIS returns you to the normal application flow.",
      },
      {
        title: "How to change your password manually",
        steps: [
          "Open `Profile`.",
          "Go to the `Security` section or open the password change page if it is linked there.",
          "Enter your updated password details.",
          "Submit the change.",
        ],
      },
    ],
    sections: [
      {
        title: "When This Page Appears",
        bullets: [
          "A forced password change appears immediately after sign-in when the account must update its password before normal use.",
          "An optional password change is also available from the Profile page under Security.",
        ],
      },
      {
        title: "Typical Workflow",
        bullets: [
          "Open the page from the enforced sign-in redirect or from Profile.",
          "Enter the required password information.",
          "Submit the change and return to the normal application flow.",
        ],
      },
      {
        title: "Common Issues",
        bullets: [
          "If you are redirected here unexpectedly, the account currently requires a password update.",
          "If the form rejects the new password, review the on-screen validation messages and retry with a compliant password value.",
        ],
      },
    ],
    related: [
      ["getting-started", "login"],
      ["getting-started", "profile"],
    ],
  },
  {
    slug: ["getting-started", "notifications"],
    title: "Notifications",
    description:
      "View new alerts, open linked pages, and mark notifications as read.",
    categoryId: "getting-started",
    audience: "Signed-in users",
    summary:
      "Notifications are available from the bell menu in the main application shell and help users jump directly into relevant pages.",
    tasks: [
      {
        title: "How to open and review notifications",
        steps: [
          "Click the bell icon in the main application shell.",
          "Review the `Notifications` dialog.",
          "Use the unread count as a quick indicator before opening items.",
          "Click a notification row to open its linked page when one is available.",
        ],
      },
      {
        title: "How to load older notifications",
        steps: [
          "Open the `Notifications` dialog.",
          "Scroll through the current visible list.",
          "Click `See More` when that action appears.",
        ],
        outcome: "HCMIS loads additional notification rows into the dialog.",
      },
      {
        title: "How to clear unread notifications",
        steps: [
          "Open the `Notifications` dialog.",
          "Use the footer action to mark all notifications as read when it is available.",
        ],
        outcome: "Unread items are cleared and the bell count updates.",
      },
    ],
    sections: [
      {
        title: "What You Can Do Here",
        bullets: [
          "Open the notifications dialog from the bell icon.",
          "See the current unread count before opening the full list.",
          "Open a notification to navigate to its linked page when one is available.",
          "Mark all notifications as read from the dialog footer.",
        ],
      },
      {
        title: "Behavior To Expect",
        bullets: [
          "Unread notifications are visually distinct from previously opened items.",
          "Selecting an unread notification attempts to mark it as read before navigation.",
          "The list loads incrementally, with a See More action when additional notifications exist.",
        ],
      },
      {
        title: "Common Issues",
        bullets: [
          "If the count and list look out of sync, refresh the dialog by reopening it.",
          "Some notifications may not redirect if no target page URL was recorded for that item.",
        ],
      },
    ],
    related: [
      ["getting-started", "dashboard"],
      ["workflows", "request-inbox"],
    ],
  },
  {
    slug: ["employee", "attendance"],
    title: "Attendance",
    description: "Review your attendance records and current period summaries.",
    categoryId: "employee-features",
    audience: "Employees",
    summary: "Use this page to check your attendance records.",
    tasks: [
      {
        title: "How to review your attendance for the current month",
        steps: [
          "Open `My Attendance` from the sidebar or dashboard.",
          "Review the attendance table for each day in the selected month.",
          "Check the `Shift`, `Punches`, and `Status` columns for each row.",
          "Click a day row if the page opens a day detail view.",
        ],
      },
      {
        title: "How to inspect a specific day's punches",
        steps: [
          "Open `My Attendance`.",
          "Locate the day you want to inspect.",
          "Review the `IN` and `OUT` chips shown in the punches area.",
          "Use the selected day details if the page exposes them.",
        ],
        outcome:
          "You can confirm whether HCMIS already recorded your punches for that date.",
      },
    ],
    sections: [
      {
        title: "What You Can Do Here",
        bullets: [
          "Check your attendance for each day.",
          "See your recorded punches.",
          "See if a day has missing punches or no schedule.",
        ],
      },
      {
        title: "How To Read The Page",
        paragraphs: [
          "The exact attendance presentation may vary by period and schedule, but the main purpose stays the same: show what HCMIS currently recognizes for your recorded attendance.",
          "If the page shows no schedule or no attendance records for a day, that reflects the data currently available to the application rather than a guarantee that no work occurred.",
        ],
      },
      {
        title: "Common Issues",
        bullets: [
          "If a punch is missing, first check the correct date and schedule.",
          "If your attendance does not match the biometric record, contact HR or the attendance admin.",
        ],
      },
    ],
    related: [
      ["attendance-biometric", "biometric-sync-overview"],
      ["workflows", "status-guide"],
    ],
  },
  {
    slug: ["employee", "leave"],
    title: "Leave Requests",
    description:
      "Submit leave requests, track approvals, and review your leave-related records.",
    categoryId: "employee-features",
    audience: "Employees",
    summary: "Use this page to file leave and track the result.",
    tasks: [
      {
        title: "How to create a leave request",
        steps: [
          "Open `My Leave`.",
          "Click `Create Leave Request`.",
          "Choose the date in `Date`.",
          "Select the leave type in `Type`.",
          "Enter the reason or details in `Info`.",
          "Click `Submit Request`.",
        ],
        outcome:
          "The request is added to `My Requests` and enters the approval workflow as `Pending`.",
      },
      {
        title: "How to review your leave requests",
        steps: [
          "Open `My Leave`.",
          "Use the `Year`, `Month`, and `Status` filters to narrow the list.",
          "Check the row for `Date`, `Type`, `Status`, `Approvals`, and `Info`.",
        ],
      },
      {
        title: "How to cancel a pending leave request",
        steps: [
          "Open `My Leave`.",
          "Find the request in the table.",
          "Confirm it is still marked `Pending`.",
          "Click `Cancel` on that row.",
        ],
        outcome:
          "If cancellation is still allowed, the request changes to `Cancelled`.",
      },
    ],
    sections: [
      {
        title: "What You Can Do Here",
        bullets: [
          "Create a leave request.",
          "Check your leave request status.",
          "Review leave credits when they are shown.",
          "Cancel a pending request if cancellation is still allowed.",
        ],
      },
      {
        title: "Approval Behavior",
        paragraphs: [
          "Leave requests move through the shared approval workflow used by HCMIS. A request remains pending until the assigned reviewer or approval chain resolves it.",
          "From the request handling surfaces, approvers may also classify an approved leave outcome based on the available approval options shown in the review action.",
        ],
      },
      {
        title: "Common Issues",
        bullets: [
          "If you cannot cancel a leave request, it may already be approved, rejected, or locked for editing.",
          "If your leave credits look wrong, check the year and your earlier requests first.",
        ],
      },
    ],
    related: [
      ["workflows", "approvals-overview"],
      ["workflows", "status-guide"],
      ["workflows", "request-inbox"],
    ],
  },
  {
    slug: ["employee", "overtime"],
    title: "Overtime Requests",
    description: "Create overtime requests and track decisions from approvers.",
    categoryId: "employee-features",
    audience: "Employees",
    summary: "Use this page to file overtime and track the result.",
    tasks: [
      {
        title: "How to submit an overtime request",
        steps: [
          "Open `My Overtime`.",
          "Click `Create Overtime Request`.",
          "Choose the work date in `Date`.",
          "Enter the explanation in `Reason`.",
          "Click `Submit`.",
        ],
        outcome:
          "The request is created and shown in `My Requests` for approval tracking.",
        notes: [
          "If the page says no overtime approver is configured, contact HR before trying again.",
          "HCMIS prevents an active overtime request for a date that already has an active leave or overtime request.",
        ],
      },
      {
        title: "How to check an overtime request status",
        steps: [
          "Open `My Overtime`.",
          "Use the `Year`, `Month`, and `Status` filters if needed.",
          "Review the request row for `Status`, `Approvals`, and `Info`.",
        ],
      },
      {
        title: "How to cancel a pending overtime request",
        steps: [
          "Open `My Overtime`.",
          "Find the request in `My Requests`.",
          "Confirm the request is still `Pending`.",
          "Click `Cancel`.",
        ],
        outcome:
          "The request is updated to `Cancelled` if the system accepts the action.",
      },
    ],
    sections: [
      {
        title: "What You Can Do Here",
        bullets: [
          "Create an overtime request.",
          "Add the reason for the request.",
          "Check if the request is still pending or already decided.",
          "Cancel a pending request if cancellation is still allowed.",
        ],
      },
      {
        title: "How The Workflow Moves",
        paragraphs: [
          "Overtime requests appear in personal workflow pages and in shared request-review surfaces. A pending request stays actionable until an assigned approver responds or the request is cancelled.",
          "HR and staff reviewers may also work the same request from Overtime Management, where escalation to a backup approver can be available for unresolved pending items.",
        ],
      },
      {
        title: "Common Issues",
        bullets: [
          "If the request stays pending, it may still be waiting for an approver.",
          "If you cannot cancel it, the request may already have been acted on.",
        ],
      },
    ],
    related: [
      ["hr-admin", "overtime-management"],
      ["workflows", "approvals-overview"],
      ["workflows", "status-guide"],
    ],
  },
  {
    slug: ["employee", "official-business"],
    title: "Official Business Requests",
    description: "Submit official business requests and monitor the result.",
    categoryId: "employee-features",
    audience: "Employees",
    summary:
      "Use this page to file official business requests and track the result.",
    tasks: [
      {
        title: "How to create an official business request",
        steps: [
          "Open `My Official Business`.",
          "Click `Create Official Business Request`.",
          "Choose the date for the request.",
          "Enter the request details or context in the form.",
          "Click the submit button to send the request.",
        ],
        outcome:
          "The request is added to your list and enters the approval workflow.",
        notes: [
          "If the page says no eligible approvers are configured, contact HR before trying again.",
        ],
      },
      {
        title: "How to track or cancel an official business request",
        steps: [
          "Open `My Official Business`.",
          "Review the request list for the request status and details.",
          "If the request is still pending and the `Cancel` action is available, click `Cancel`.",
        ],
        outcome:
          "Pending requests can be withdrawn while the system still allows cancellation.",
      },
    ],
    sections: [
      {
        title: "What You Can Do Here",
        bullets: [
          "Create an official business request.",
          "Add the needed details.",
          "Check if the request is pending or already decided.",
          "Cancel a pending request if cancellation is still allowed.",
        ],
      },
      {
        title: "Workflow Notes",
        paragraphs: [
          "Official business requests participate in the shared HCMIS approval model. Users may see the same request in both personal tracking views and approval-oriented views, depending on role.",
        ],
      },
      {
        title: "Common Issues",
        bullets: [
          "If you do not see an action button, this step may no longer belong to you.",
          "If the request is still pending, it may still be waiting for an approver.",
        ],
      },
    ],
    related: [
      ["workflows", "approvals-overview"],
      ["workflows", "request-inbox"],
    ],
  },
  {
    slug: ["employee", "certificate-of-attendance"],
    title: "Certificate of Attendance Requests",
    description:
      "Submit certificate attendance requests and follow the response lifecycle.",
    categoryId: "employee-features",
    audience: "Employees",
    summary: "Use this page to request a certificate of attendance.",
    tasks: [
      {
        title: "How to create a certificate of attendance request",
        steps: [
          "Open `My Certificate of Attendance`.",
          "Click `Create Certificate Request`.",
          "Choose the request date.",
          "Fill in the attendance details such as time and punch type if the form requires them.",
          "Enter the additional context or reason.",
          "Submit the request.",
        ],
        outcome:
          "The request is added to your list and enters the approval workflow.",
      },
      {
        title: "How to review or cancel a certificate request",
        steps: [
          "Open `My Certificate of Attendance`.",
          "Review the request list for the current status and details.",
          "If the request is still pending and cancellation is available, click `Cancel`.",
        ],
        outcome:
          "The request is withdrawn and marked `Cancelled` if the cancellation succeeds.",
      },
    ],
    sections: [
      {
        title: "What You Can Do Here",
        bullets: [
          "Create a certificate request.",
          "Add the date and other attendance details if the form asks for them.",
          "Check the request status.",
          "Cancel a pending request if cancellation is still allowed.",
        ],
      },
      {
        title: "What Reviewers See",
        paragraphs: [
          "Review surfaces show the request date, status, acted-by information, and the submitted details such as time and punch values when present. This helps approvers understand what the request is asking to certify.",
        ],
      },
      {
        title: "Common Issues",
        bullets: [
          "A request may stop being editable after it enters approval.",
          "If the status is unclear, check the status guide before following up.",
        ],
      },
    ],
    related: [
      ["workflows", "approvals-overview"],
      ["workflows", "status-guide"],
    ],
  },
  {
    slug: ["workflows", "request-inbox"],
    title: "Request Inbox",
    description:
      "Unified request monitor for leave, overtime, official business, and certificate attendance workflows.",
    categoryId: "approvals-and-workflows",
    audience:
      "Approvers, HR/admin users, and request submitters tracking items",
    summary: "Use this page to review requests that need attention.",
    tasks: [
      {
        title: "How to find a request in Request Inbox",
        steps: [
          "Open `Request Inbox`.",
          "Use the `Type` filter to narrow the list to one request type if needed.",
          "Use the `Status`, `Year`, and `Month` filters to refine the results.",
          "Review the matching row for requester, date, status, acted-by information, and request details.",
        ],
      },
      {
        title: "How to approve or reject a request",
        steps: [
          "Open `Request Inbox` and find the pending request row.",
          "Confirm the action buttons are visible for your account.",
          "Click `Approve` or `Reject`.",
          "For leave requests, choose the required approval type when the page asks for it.",
        ],
        outcome: "The request updates immediately after the response succeeds.",
      },
      {
        title: "How to cancel your own request from the inbox",
        steps: [
          "Open `Request Inbox`.",
          "Locate your own pending request row.",
          "Click `Cancel`.",
        ],
        outcome:
          "The request is withdrawn and marked `Cancelled` when self-cancellation is still allowed.",
      },
    ],
    sections: [
      {
        title: "What You Can Do Here",
        bullets: [
          "View requests from different modules in one list.",
          "Filter the list to find a request faster.",
          "Approve or reject a request when it is your turn to act.",
          "Cancel your own pending request if the page allows it.",
        ],
      },
      {
        title: "How The Table Works",
        paragraphs: [
          "The inbox merges data from both personal request endpoints and approval endpoints, then removes duplicates. That means one request can still appear in a single list even when it is relevant to you in more than one way.",
          "Rows show the request type, requester, date, status, acted-by label, and request information. Available actions change according to your role in that request and the current status.",
        ],
      },
      {
        title: "Important Workflow Details",
        bullets: [
          "Leave approvals can require a specific approval type selection when approving.",
          "Approve and Reject actions appear only when your assignment in the approver pool is still pending.",
          "Cancel appears only for your own pending requests.",
        ],
      },
    ],
    related: [
      ["workflows", "approvals-overview"],
      ["workflows", "status-guide"],
      ["employee", "overtime"],
      ["employee", "leave"],
    ],
  },
  {
    slug: ["workflows", "approvals-overview"],
    title: "Approvals Overview",
    description:
      "Shared explanation of how request approvals move across HCMIS modules.",
    categoryId: "approvals-and-workflows",
    audience: "Employees, approvers, and admins",
    summary: "Most request pages follow the same approval flow.",
    tasks: [
      {
        title: "How to follow a request after submitting it",
        steps: [
          "Submit the request from its feature page such as `Leave`, `Overtime`, `Official Business`, or `Certificate of Attendance`.",
          "Return to that feature page or open `Request Inbox`.",
          "Find the request row and check its current status.",
          "Review the approver or acted-by information when it is shown.",
        ],
      },
      {
        title: "How approvers process a pending request",
        steps: [
          "Open `Request Inbox` or the dedicated management page for the request type.",
          "Filter the list until the pending request appears.",
          "Review the request details and current approval state.",
          "Click `Approve` or `Reject` when your account is the active reviewer.",
        ],
      },
    ],
    sections: [
      {
        title: "Shared Workflow Model",
        paragraphs: [
          "A user creates a request, the request becomes pending, and it stays there until the right reviewer acts on it.",
          "Whether you can act on a request depends on your role and whether the request is currently assigned to you.",
        ],
      },
      {
        title: "Typical Outcomes",
        bullets: [
          "Approve means the request is accepted.",
          "Reject means the request is declined.",
          "Cancel is usually only available to the person who created the request while it is still pending.",
          "Escalate can appear on some management pages when a backup approver needs to take over.",
        ],
      },
      {
        title: "Where To Review Requests",
        bullets: [
          "Personal feature pages let a requester monitor their own submissions.",
          "Request Inbox consolidates multiple request types into one review surface.",
          "Dedicated management pages provide feature-specific filtering and control for HR or admin users.",
        ],
      },
    ],
    related: [
      ["workflows", "request-inbox"],
      ["workflows", "status-guide"],
    ],
  },
  {
    slug: ["workflows", "status-guide"],
    title: "Status Guide",
    description:
      "Reference page for the most common workflow and record statuses used across HCMIS.",
    categoryId: "approvals-and-workflows",
    audience: "All visitors",
    summary: "This page explains the most common status labels in HCMIS.",
    tasks: [
      {
        title: "How to interpret a request status",
        steps: [
          "Open the page that shows the request or record.",
          "Locate the status badge or status column for that item.",
          "Use this guide to interpret `Pending`, `Approved`, `Rejected`, or `Cancelled`.",
          "If the module also shows approver or acted-by information, use that detail to understand who last handled the request.",
        ],
      },
      {
        title: "How to handle a request that still shows pending",
        steps: [
          "Confirm the request is still `Pending` on its source page or in `Request Inbox`.",
          "Check whether the page shows approver or acted-by context.",
          "If no action button is available to you, wait for the assigned reviewer or contact the responsible approver through the normal process.",
        ],
      },
    ],
    sections: [
      {
        title: "Core Request Statuses",
        bullets: [
          "Pending means the request is still waiting for action.",
          "Approved means the request was accepted.",
          "Rejected means the request was declined.",
          "Cancelled means the request was withdrawn.",
        ],
      },
      {
        title: "How To Interpret A Pending Item",
        paragraphs: [
          "Pending does not always mean there is a problem. It often just means the assigned reviewer has not acted yet.",
          "If the page shows approver or acted-by details, use that to see who last handled the request.",
        ],
      },
      {
        title: "Module-Specific Notes",
        bullets: [
          "Some pages may expose additional workflow concepts such as escalation, release, or publication states. Those are documented on the affected feature pages rather than treated as universal statuses.",
          "If two pages show different labels for the same record, use the feature-specific page to interpret that module's wording first.",
        ],
      },
    ],
    related: [
      ["workflows", "approvals-overview"],
      ["employee", "leave"],
      ["employee", "overtime"],
    ],
  },
  {
    slug: ["hr-admin", "overtime-management"],
    title: "Overtime Management",
    description:
      "HR-facing workspace for filtering, reviewing, and escalating overtime requests across teams.",
    categoryId: "hr-and-admin-features",
    audience: "HR/admin users and approvers",
    summary: "Use this page to review overtime requests across teams.",
    tasks: [
      {
        title: "How to review overtime requests across teams",
        steps: [
          "Open `Overtime Management`.",
          "Stay on the `Request Monitor` tab.",
          "Use the `User`, `Department`, `Status`, `Year`, and `Month` filters to narrow the list.",
          "Review each matching row for employee, department, date, status, acted-by information, and request details.",
        ],
      },
      {
        title: "How to approve or reject an overtime request",
        steps: [
          "Open `Overtime Management` and locate the request row.",
          "Confirm the request is still `Pending` and action buttons are available.",
          "Click `Approve` or `Reject`.",
        ],
        outcome:
          "The request updates with the new status and acted-by information.",
      },
      {
        title: "How to escalate an overtime request to backup approver",
        steps: [
          "Open `Overtime Management`.",
          "Find a `Pending` request that still shows `Escalate To Backup`.",
          "Click `Escalate To Backup`.",
        ],
        outcome:
          "The request is escalated to the backup approver when the action succeeds.",
      },
    ],
    sections: [
      {
        title: "What You Can Do Here",
        bullets: [
          "Filter overtime requests.",
          "Review request details.",
          "Approve or reject pending requests.",
          "Escalate a request to a backup approver when allowed.",
        ],
      },
      {
        title: "How The Page Is Organized",
        paragraphs: [
          "The Request Monitor tab provides a table of overtime requests across teams. It is designed for monitoring and action rather than personal request entry.",
          "Each row shows the employee name, department, date, status, approver history label, and request information. Action buttons are shown only when the current account can legally act on that row.",
        ],
      },
      {
        title: "Public-Safe Admin Notes",
        bullets: [
          "Escalation is intended for pending requests that still need movement to a backup approver, not for already resolved records.",
          "The presence of action buttons depends on both role and request assignment state, so two HR users may not always see the same controls on the same record.",
        ],
      },
    ],
    related: [
      ["employee", "overtime"],
      ["workflows", "approvals-overview"],
      ["workflows", "status-guide"],
    ],
  },
  {
    slug: ["attendance-biometric", "biometric-sync-overview"],
    title: "Biometric Sync Overview",
    description:
      "Public-safe explanation of the app-facing biometric comparison and sync workflow.",
    categoryId: "attendance-and-biometric",
    audience: "HR/admin users and public readers",
    summary: "Use this page to compare app users with biometric records.",
    tasks: [
      {
        title: "How to refresh biometric comparison results",
        steps: [
          "Open `Biometric Sync`.",
          "Review or update `Site code` and `Device ID` if needed.",
          "Click `Refresh Sync`.",
        ],
        outcome:
          "The page reloads the latest command history and reconciliation rows for the selected site and device.",
      },
      {
        title: "How to sync biometric users",
        steps: [
          "Open `Biometric Sync`.",
          "Confirm the `Site code` and `Device ID` values.",
          "Click `Sync Biometric Users`.",
          "Wait while the status moves through queued or in-progress states.",
        ],
        outcome:
          "When the sync completes, the reconciliation table reflects the latest comparison results.",
      },
      {
        title: "How to create an app user from a biometric-only row",
        steps: [
          "Open `Biometric Sync` and review the comparison table.",
          "Find a row where the biometric record exists but the app record does not.",
          "Click `Create App User`.",
          "Complete the user details in the dialog.",
          "Save the new user.",
        ],
        outcome:
          "HCMIS creates an application user and refreshes the comparison results.",
      },
    ],
    sections: [
      {
        title: "What The Page Does",
        bullets: [
          "Compare app users with biometric users.",
          "Refresh the latest sync result.",
          "Run a biometric sync from the page.",
          "Review rows that show missing or matched records.",
        ],
      },
      {
        title: "How To Read The Results",
        paragraphs: [
          "The page displays a comparison table with biometric UID, presence indicators, app name, and biometric name. This is meant to show mismatches clearly rather than act as a full deployment or infrastructure console.",
          "When a biometric record exists without a matching application user, the page can expose a Create App User action so HR can bridge the gap from the application side.",
        ],
      },
      {
        title: "Status And Progress",
        bullets: [
          "The current command state can appear as queued, in progress, completed, or failed.",
          "A sync in progress displays a waiting message while the page polls for the result.",
          "If no rows appear yet, the page prompts the user to run the sync flow first.",
        ],
      },
      {
        title: "Scope Limits",
        paragraphs: [
          "This public documentation intentionally explains only the app-facing workflow. It does not include bridge deployment, agent keys, network setup, or other internal operational details.",
        ],
      },
    ],
    related: [
      ["employee", "attendance"],
      ["hr-admin", "overtime-management"],
    ],
  },
  {
    slug: ["employee", "my-payslips"],
    title: "My Payslips",
    description:
      "View released payroll records and review the information shown for your account.",
    categoryId: "employee-features",
    audience: "Employees",
    summary:
      "My Payslips is the employee-facing page for checking released payroll records and understanding what is currently available for viewing.",
    tasks: [
      {
        title: "How to view a payslip summary",
        steps: [
          "Open `My Payslips`.",
          "Find the released payslip in the table.",
          "Click `View`.",
        ],
        outcome:
          "HCMIS opens the `Payslip Summary` dialog with the computed payroll breakdown.",
      },
      {
        title: "How to download a payslip PDF",
        steps: [
          "Open `My Payslips`.",
          "Click `View` on the payslip you need.",
          "In the `Payslip Summary` dialog, click `Download PDF`.",
        ],
        outcome:
          "HCMIS opens the print or PDF-ready view for that payslip summary.",
      },
    ],
    sections: [
      {
        title: "What You Can Do Here",
        bullets: [
          "Open released payslip records that are already visible to your account.",
          "Review period or cutoff information shown for each record.",
          "Confirm whether the latest payroll item is already released.",
        ],
      },
      {
        title: "What To Expect",
        paragraphs: [
          "This page is for payroll visibility, not payroll administration. If a payslip is still unreleased, that usually means the payroll cycle is not yet complete from the administrative side.",
        ],
      },
      {
        title: "Common Issues",
        bullets: [
          "If a payslip is missing, confirm that the relevant period has already been released.",
          "If a visible amount or summary seems incorrect, compare it against the correct period first before raising a payroll issue.",
        ],
      },
    ],
    related: [
      ["payroll", "payslips-management"],
      ["troubleshooting", "attendance-and-payroll-issues"],
    ],
  },
  {
    slug: ["employee", "my-thirteenth-month"],
    title: "My Thirteenth Month",
    description:
      "View thirteenth month payout visibility from the employee side.",
    categoryId: "employee-features",
    audience: "Employees",
    summary:
      "This page helps employees review what HCMIS currently exposes about their thirteenth month payout records.",
    tasks: [
      {
        title: "How to check your thirteenth month payout",
        steps: [
          "Open `My 13th Month Payouts`.",
          "Review the table row for the year you need.",
          "Check the `Gross`, `Deductions`, `Net`, and `Released` columns.",
        ],
        outcome:
          "You can confirm whether a payout is already available and what values are currently shown.",
      },
    ],
    sections: [
      {
        title: "What You Can Do Here",
        bullets: [
          "Review thirteenth month payout information associated with your account.",
          "Check whether the payout is already visible or still pending release.",
        ],
      },
      {
        title: "What To Expect",
        paragraphs: [
          "This page is a visibility surface. Adjustments, generation, and release decisions are handled from HR or payroll management pages rather than from the employee view.",
        ],
      },
      {
        title: "Common Issues",
        bullets: [
          "If no record appears yet, the payout may still be under preparation or not yet released.",
          "If the visible record does not match expectation, escalate it through the payroll process rather than treating it as a profile issue.",
        ],
      },
    ],
    related: [
      ["payroll", "thirteenth-month-management"],
      ["troubleshooting", "attendance-and-payroll-issues"],
    ],
  },
  {
    slug: ["employee", "performance-evaluations"],
    title: "Performance Evaluations",
    description:
      "Review assigned evaluations and complete any required participation tasks.",
    categoryId: "employee-features",
    audience: "Employees and evaluators",
    summary:
      "Performance Evaluations is the employee-facing area for reviewing assigned evaluation work and following the current evaluation state.",
    tasks: [
      {
        title: "How to review your available evaluation cycles",
        steps: [
          "Open `Performance Evaluations`.",
          "Review the available cycle list on the page.",
          "Select the cycle or evaluation workspace item you need.",
          "Check whether the cycle is still open or already finalized.",
        ],
      },
      {
        title: "How to complete an evaluation assigned to you",
        steps: [
          "Open `Performance Evaluations`.",
          "Choose the assigned cycle.",
          "Open the evaluation task that still needs your response.",
          "Complete the available form fields and submit through the page action provided in the evaluation flow.",
        ],
        outcome:
          "Your evaluation participation is recorded for the current cycle.",
      },
    ],
    sections: [
      {
        title: "What You Can Do Here",
        bullets: [
          "Open evaluations assigned to your account.",
          "Complete or review evaluator-related tasks when they are available.",
          "Track whether an evaluation is still active or already finalized.",
        ],
      },
      {
        title: "Workflow Notes",
        paragraphs: [
          "Evaluation activity can involve both the evaluated user and assigned evaluators. Depending on your role in that process, the page may present submission or review tasks instead of a simple read-only summary.",
        ],
      },
      {
        title: "Common Issues",
        bullets: [
          "If an expected evaluation is missing, confirm whether it has already been assigned to your account.",
          "If you can view an evaluation but cannot act on it, the evaluation may already be finalized or your role in that stage may be complete.",
        ],
      },
    ],
    related: [
      ["hr-admin", "performance"],
      ["workflows", "status-guide"],
    ],
  },
  {
    slug: ["employee", "announcements-and-polls"],
    title: "Announcements and Polls",
    description:
      "Read published announcements and participate in currently available polls.",
    categoryId: "employee-features",
    audience: "Employees",
    summary:
      "This page surfaces employee-facing updates and polling activity that are currently visible to the wider workspace.",
    tasks: [
      {
        title: "How to read a full announcement",
        steps: [
          "Open `Announcements and Polls`.",
          "Use the `Announcements` filter or leave the feed on `All`.",
          "Find the published announcement card you need.",
          "Click `Read Notice`.",
        ],
        outcome: "HCMIS opens the full announcement preview dialog.",
      },
      {
        title: "How to vote in a poll",
        steps: [
          "Open `Announcements and Polls`.",
          "Use the `Polls` filter if needed.",
          "Click `Participate` on a published poll.",
          "Select one or more choices depending on whether multiple choices are allowed.",
          "Click `Submit Vote`.",
        ],
        outcome:
          "Your vote is recorded and the poll becomes read-only for your account.",
      },
    ],
    sections: [
      {
        title: "What You Can Do Here",
        bullets: [
          "Read published announcements that are visible to your account.",
          "Participate in polls that are open and available for response.",
          "Review recent updates that may also appear in dashboard feed surfaces.",
        ],
      },
      {
        title: "Visibility Notes",
        paragraphs: [
          "This page is intended for published, employee-facing content. Draft and administrative content management happens in the HR or performance administration areas, not here.",
        ],
      },
      {
        title: "Common Issues",
        bullets: [
          "If a poll is no longer actionable, it may already be closed or archived.",
          "If an announcement expected by one team is not visible to another, access or publication scope may differ.",
        ],
      },
    ],
    related: [
      ["hr-admin", "performance"],
      ["getting-started", "dashboard"],
    ],
  },
  {
    slug: ["employee", "shared-resources"],
    title: "Shared Resources",
    description:
      "Browse documents and files that have been shared with your account.",
    categoryId: "employee-features",
    audience: "Employees",
    summary:
      "Shared Resources provides a user-facing view of documents and files that administrators or resource owners have made available to you.",
    tasks: [
      {
        title: "How to open or download a shared resource",
        steps: [
          "Open `Shared Resources`.",
          "Find the file or document you need.",
          "Use the available open or download action shown for that item.",
        ],
      },
      {
        title: "How to confirm whether a missing file is an access issue",
        steps: [
          "Open `Shared Resources`.",
          "Check whether the resource is listed at all.",
          "If the file is visible but unavailable, review any confidentiality or access note shown on the page.",
          "If the file is not visible, confirm with the resource owner or HR that it was shared to your account.",
        ],
      },
    ],
    sections: [
      {
        title: "What You Can Do Here",
        bullets: [
          "View shared resource listings available to your account.",
          "Open or download items when the file and access rules allow it.",
          "Recognize when a resource has additional confidentiality controls.",
        ],
      },
      {
        title: "Access Notes",
        paragraphs: [
          "Some resources may have restricted access or confidentiality requirements. If a resource is visible but not fully accessible, the limitation may be intentional rather than an error.",
        ],
      },
      {
        title: "Common Issues",
        bullets: [
          "If a file cannot be opened, confirm that your account has the required access level.",
          "If an expected resource is missing, it may not have been shared to your account or group yet.",
        ],
      },
    ],
    related: [
      ["hr-admin", "shared-resources"],
      ["troubleshooting", "common-access-issues"],
    ],
  },
  {
    slug: ["employee", "trainings"],
    title: "Trainings",
    description:
      "Review training-related information that is visible to your account.",
    categoryId: "employee-features",
    audience: "Employees",
    summary:
      "Training-related pages let users review assigned or completed training information exposed through HCMIS.",
    tasks: [
      {
        title: "How to review your training information",
        steps: [
          "Open the training-related page or training section available to your account.",
          "Review the visible training records for assigned, completed, or informational items.",
          "Open any available training detail view if the page provides one.",
        ],
        outcome:
          "You can confirm what training information is currently visible for your account.",
      },
    ],
    sections: [
      {
        title: "What You Can Do Here",
        bullets: [
          "Review training information made visible to your account.",
          "Check whether participation or completion details are already recorded.",
          "Use the page to confirm whether a training item is informational or tied to your account history.",
        ],
      },
      {
        title: "What To Expect",
        paragraphs: [
          "Training visibility can appear in more than one place, including profile-related sections and management-led views. The employee-facing purpose is to confirm what has been assigned, completed, or made visible to you.",
        ],
      },
      {
        title: "Common Issues",
        bullets: [
          "If a completed training is not yet reflected, the completion record may still need to be finalized in the management workflow.",
          "If you expected a training assignment but do not see it, confirm the training has already been published or assigned.",
        ],
      },
    ],
    related: [
      ["hr-admin", "trainings-management"],
      ["getting-started", "profile"],
    ],
  },
  {
    slug: ["hr-admin", "users"],
    title: "User Management",
    description: "Public-safe overview of the HR user management workspace.",
    categoryId: "hr-and-admin-features",
    audience: "HR/admin users",
    summary: "Use this page to add, find, and open employee accounts.",
    tasks: [
      {
        title: "How to add a user",
        steps: [
          "Open `User Management`.",
          "Click `Add User`.",
          "Fill in the required account fields such as `Email`, `Username`, `Password`, `Confirm Password`, `First Name`, and `Last Name`.",
          "Complete the additional sections for organization, approvers, contact details, education, and employment details as needed.",
          "If you assign a position, also provide the matching `Rank Level` because those fields are required together.",
          "Click `Create User`.",
        ],
        outcome:
          "The user is added to the user list and becomes available for related workflows.",
        notes: [
          "If you provide a biometric UID, it must be a whole number.",
          "Level 2 approver must be different from Level 1 approver.",
        ],
      },
      {
        title: "How to search and filter users",
        steps: [
          "Open `User Management`.",
          "Use `Search` to look up users by name, email, username, employee number, rank, or department text.",
          "Use the `Department` and `Status` filters to narrow the results.",
        ],
      },
      {
        title: "How to open a user profile",
        steps: [
          "Open `User Management`.",
          "Find the user in the table.",
          "Click `View` on that row.",
        ],
        outcome: "HCMIS opens the detailed HR user profile page.",
      },
      {
        title: "How to open biometric sync from User Management",
        steps: [
          "Open `User Management`.",
          "Click `Biometric Sync` in the page action area.",
        ],
        outcome: "HCMIS opens the biometric comparison workspace.",
      },
    ],
    sections: [
      {
        title: "What You Can Do Here",
        bullets: [
          "Add a new user.",
          "Search for an existing user.",
          "Open a user profile.",
          "Open biometric sync.",
        ],
      },
      {
        title: "Public-Safe Notes",
        paragraphs: [
          "This documentation describes the page at a feature level only. Internal identity governance, sensitive recovery procedures, and environment-specific controls are intentionally excluded from the public help center.",
        ],
      },
      {
        title: "Common Issues",
        bullets: [
          "If an action is missing, your account may not have access to it.",
          "If user details look wrong, open the user profile and confirm the saved values there.",
        ],
      },
    ],
    related: [
      ["hr-admin", "user-profile"],
      ["attendance-biometric", "biometric-sync-overview"],
    ],
  },
  {
    slug: ["hr-admin", "user-profile"],
    title: "HR User Profile",
    description: "Detailed HR-facing view of a single employee record.",
    categoryId: "hr-and-admin-features",
    audience: "HR/admin users",
    summary:
      "HR User Profile is the detailed view used to inspect and manage information for one employee record at a time.",
    tasks: [
      {
        title: "How to edit a user profile",
        steps: [
          "Open the HR user profile for the employee.",
          "Click `Edit Profile`.",
          "Update the available fields in the edit dialog.",
          "Save the changes.",
        ],
        outcome:
          "The employee profile is updated and the page refreshes with the saved values.",
      },
      {
        title: "How to reset a user's password",
        steps: [
          "Open the HR user profile.",
          "Scroll to `Security`.",
          "Click `Reset Password`.",
          "In the dialog, click `Generate Temporary Password`.",
          "Copy the generated temporary password if needed.",
        ],
        outcome:
          "A temporary password is created and the user is required to change it on next login.",
      },
      {
        title: "How to activate or deactivate a user",
        steps: [
          "Open the HR user profile.",
          "Go to `Security`.",
          "Click `Deactivate User` or `Activate User`.",
          "Confirm the action in the confirmation dialog.",
        ],
        outcome: "The user's account access state is updated.",
      },
      {
        title: "How to update shift template selection for a user",
        steps: [
          "Open the HR user profile.",
          "Scroll to `Shift Template Selection`.",
          "Check or uncheck the shift templates you want for the user.",
          "Click `Save Shift Templates`.",
        ],
        outcome: "The user's shift template policy is updated.",
      },
    ],
    sections: [
      {
        title: "What You Can Do Here",
        bullets: [
          "Review a specific employee record in more detail than the main user list.",
          "Check profile, employment, and related record areas that are exposed to HR.",
          "Confirm information before taking user-management actions from the broader workspace.",
        ],
      },
      {
        title: "Usage Notes",
        paragraphs: [
          "This page is best used when a general user list is not enough and HR needs to inspect one account more closely. It complements, rather than replaces, the main User Management page.",
        ],
      },
      {
        title: "Common Issues",
        bullets: [
          "If a detail looks outdated, confirm whether it is sourced from an editable record or a managed record that updates through a different process.",
        ],
      },
    ],
    related: [
      ["hr-admin", "users"],
      ["getting-started", "profile"],
    ],
  },
  {
    slug: ["hr-admin", "departments"],
    title: "Departments",
    description:
      "Manage department records used by HCMIS organizational workflows.",
    categoryId: "hr-and-admin-features",
    audience: "HR/admin users",
    summary:
      "Departments supports organizational structure management and affects how users and related workflows are grouped in the application.",
    tasks: [
      {
        title: "How to add a department",
        steps: [
          "Open `Department Management`.",
          "Click `Add Department`.",
          "Enter the `Department name`.",
          "Enter the `Department code`.",
          "Choose the `Status`.",
          "Click `Create`.",
        ],
        outcome: "The new department is added to the department list.",
      },
      {
        title: "How to edit a department",
        steps: [
          "Open `Department Management`.",
          "Find the department in the table.",
          "Click `Edit`.",
          "Update the name, code, or status.",
          "Click `Save`.",
        ],
        outcome: "The department record is updated.",
      },
      {
        title: "How to activate or deactivate a department",
        steps: [
          "Open `Department Management`.",
          "Find the department in the table.",
          "Click `Deactivate` or `Activate`.",
          "Confirm the action.",
        ],
        outcome:
          "The department becomes unavailable or available for active assignment depending on the action you chose.",
      },
      {
        title: "How to delete a department",
        steps: [
          "Open `Department Management`.",
          "Find the department in the table.",
          "Click `Delete`.",
          "Confirm the deletion.",
        ],
        outcome:
          "The department is removed if it is no longer referenced by blocking records.",
      },
    ],
    sections: [
      {
        title: "What You Can Do Here",
        bullets: [
          "Review the department list and existing department records.",
          "Add or update department information as allowed by the page.",
          "Understand which department structure is currently available for assignment and filtering across the system.",
        ],
      },
      {
        title: "Why It Matters",
        paragraphs: [
          "Departments are not just labels. They can influence how users are grouped in management views, reporting, scheduling, and some workflow filtering surfaces.",
        ],
      },
    ],
    related: [
      ["hr-admin", "organizations"],
      ["hr-admin", "user-attendance-management"],
    ],
  },
  {
    slug: ["hr-admin", "organizations"],
    title: "Organizations",
    description:
      "Public-safe overview of organization-level record management.",
    categoryId: "hr-and-admin-features",
    audience: "HR/admin users",
    summary:
      "Organizations provides an administrative surface for maintaining broader organizational structure in HCMIS.",
    tasks: [
      {
        title: "How to use Organization as a navigation hub",
        steps: [
          "Open `Organization` from the HR workspace.",
          "Review the workspace cards such as `Users` and `Departments`.",
          "Click the area you need to manage.",
        ],
        outcome:
          "HCMIS opens the detailed organization-related page for that task.",
      },
    ],
    sections: [
      {
        title: "What You Can Do Here",
        bullets: [
          "Review organization-level records exposed by the workspace.",
          "Use organization structure as context for related HR and department workflows.",
        ],
      },
      {
        title: "How To Use It",
        paragraphs: [
          "This page is typically used alongside Departments and User Management rather than as a standalone day-to-day workflow surface.",
        ],
      },
    ],
    related: [
      ["hr-admin", "departments"],
      ["hr-admin", "users"],
    ],
  },
  {
    slug: ["hr-admin", "attendance-management"],
    title: "Attendance Management",
    description: "HR-facing workspace for attendance oversight and review.",
    categoryId: "hr-and-admin-features",
    audience: "HR/admin users",
    summary:
      "Attendance Management is used for reviewing attendance-related information from the administrative side rather than the employee side.",
    tasks: [
      {
        title: "How to review attendance by employee and month",
        steps: [
          "Open `Attendance Management`.",
          "Use the `Filters` card to choose `Employee`, `Year`, and `Month`.",
          "Wait for the page to reload the attendance records.",
          "Review the `Day`, `Shift`, `Punches`, and `Status` columns.",
        ],
      },
      {
        title: "How to add or correct a punch record",
        steps: [
          "Open `Attendance Management` and load the correct employee and month.",
          "Click the day row you need so the `Selected day` panel updates.",
          "Click `Add Punch` to insert a new record, or `Edit` on an existing punch.",
          "Save the attendance record changes in the dialog.",
        ],
        outcome:
          "The selected day's punch history is updated from the admin attendance screen.",
      },
      {
        title: "How to delete an incorrect punch",
        steps: [
          "Open `Attendance Management`.",
          "Select the affected day from the attendance table.",
          "Find the wrong punch in `Punch history`.",
          "Click `Delete` and confirm the action.",
        ],
      },
    ],
    sections: [
      {
        title: "What You Can Do Here",
        bullets: [
          "Review attendance information beyond the scope of one employee account.",
          "Use the page as an oversight surface for attendance-related review and follow-up.",
        ],
      },
      {
        title: "Relationship To Other Pages",
        paragraphs: [
          "Attendance Management works alongside User Attendance Management, Shift Management, Holiday Management, and biometric-related pages. Each page handles a different part of the attendance picture.",
        ],
      },
    ],
    related: [
      ["employee", "attendance"],
      ["hr-admin", "user-attendance-management"],
      ["attendance-biometric", "attendance-overview"],
    ],
  },
  {
    slug: ["hr-admin", "user-attendance-management"],
    title: "User Attendance Management",
    description:
      "Manage user-facing attendance assignment and schedule context.",
    categoryId: "hr-and-admin-features",
    audience: "HR/admin users",
    summary:
      "User Attendance Management focuses on how attendance context is assigned and reviewed per user, including schedule-related views.",
    tasks: [
      {
        title: "How to open a user's assignment month",
        steps: [
          "Open `User Attendance Management`.",
          "Use the `Filters` card to choose an `Employee`, `Year`, and `Month`.",
          "Wait for the page to load the selected user's assignment view.",
        ],
      },
      {
        title: "How to assign shift templates day by day",
        steps: [
          "Open `User Attendance Management` for the correct employee and month.",
          "In the shift assignment area, review each day row.",
          "Click the shift template chip you want for a day.",
          "Save the assignment when the page offers a save action for pending changes.",
        ],
      },
      {
        title: "How to review assignments from the full calendar",
        steps: [
          "Open `User Attendance Management`.",
          "Click `Full Calendar`.",
          "Filter by `Department`, `Month`, `Year`, or `All users` as needed.",
          "Click a crowded day or the `+ more` action to open `Assignments for ...` details.",
        ],
      },
    ],
    sections: [
      {
        title: "What You Can Do Here",
        bullets: [
          "Review attendance information with a user-specific management lens.",
          "Work with assignment and schedule-related controls provided by the page.",
          "Use filters and calendar-based tools to inspect attendance context over time.",
        ],
      },
      {
        title: "Usage Notes",
        paragraphs: [
          "This page is typically where administrators move from broad attendance oversight into person-by-person schedule and assignment decisions.",
        ],
      },
    ],
    related: [
      ["hr-admin", "shift-management"],
      ["hr-admin", "attendance-management"],
    ],
  },
  {
    slug: ["hr-admin", "shift-management"],
    title: "Shift Management",
    description:
      "Manage shifts, templates, and related attendance scheduling concepts.",
    categoryId: "hr-and-admin-features",
    audience: "HR/admin users",
    summary:
      "Shift Management is the administrative workspace for the shift structures used in attendance scheduling and assignment.",
    tasks: [
      {
        title: "How to add a shift template",
        steps: [
          "Open `Shift Management`.",
          "Click `Add Shift`.",
          "Enter the shift details in the `Create Shift` dialog.",
          "Save the shift template.",
        ],
        outcome:
          "The new template appears in the `Shift Templates` list and becomes available for assignment.",
      },
      {
        title: "How to edit or delete a shift template",
        steps: [
          "Open `Shift Management`.",
          "Locate the shift card in `Shift Templates`.",
          "Click `Edit` to update it, or `Delete` if the template should be removed.",
          "Confirm the action when prompted.",
        ],
      },
    ],
    sections: [
      {
        title: "What You Can Do Here",
        bullets: [
          "Review the shift records and patterns available in the system.",
          "Work with shift templates or related schedule-building structures exposed by the module.",
          "Support downstream user attendance assignment workflows.",
        ],
      },
      {
        title: "Why It Matters",
        paragraphs: [
          "Shift setup influences how attendance is interpreted and managed across the application. It is closely connected to user attendance management and attendance review.",
        ],
      },
    ],
    related: [
      ["hr-admin", "user-attendance-management"],
      ["attendance-biometric", "attendance-overview"],
    ],
  },
  {
    slug: ["hr-admin", "holiday-management"],
    title: "Holiday Management",
    description:
      "Manage holiday records that affect attendance and payroll interpretation.",
    categoryId: "hr-and-admin-features",
    audience: "HR/admin users",
    summary:
      "Holiday Management is the workspace for maintaining the holiday records recognized by the application.",
    tasks: [
      {
        title: "How to add a holiday",
        steps: [
          "Open `Holiday Management`.",
          "Set the `Year` you want to review.",
          "Click `Add Holiday`.",
          "Enter the holiday details such as `Holiday Name`, date fields, and whether it is recurring or year-specific.",
          "Save the holiday.",
        ],
        outcome:
          "The holiday appears in the `Holiday Registry` for the selected year.",
      },
      {
        title: "How to edit or delete a holiday",
        steps: [
          "Open `Holiday Management`.",
          "Find the holiday in the `Holiday Registry` table.",
          "Click `Edit` to update it, or `Delete` to remove it.",
          "Confirm the deletion if you chose `Delete`.",
        ],
      },
    ],
    sections: [
      {
        title: "What You Can Do Here",
        bullets: [
          "Review and maintain holiday entries used by HCMIS.",
          "Understand which holiday definitions are currently present in the system.",
        ],
      },
      {
        title: "System Impact",
        paragraphs: [
          "Holiday definitions influence how attendance and payroll-related logic are interpreted in relevant modules. Changes here can affect downstream outputs even when the holiday page itself appears simple.",
        ],
      },
    ],
    related: [
      ["hr-admin", "attendance-management"],
      ["payroll", "payroll-overview"],
    ],
  },
  {
    slug: ["hr-admin", "leave-management"],
    title: "Leave Management",
    description:
      "Administrative workspace for leave review and related leave controls.",
    categoryId: "hr-and-admin-features",
    audience: "HR/admin users",
    summary:
      "Leave Management supports oversight of leave requests and related leave administration tasks.",
    tasks: [
      {
        title: "How to monitor leave requests",
        steps: [
          "Open `Leave Management`.",
          "Stay on the `Request Monitor` tab.",
          "Use the `User`, `Department`, `Status`, `Year`, and `Month` filters to narrow the list.",
          "Review the row details including employee, date, leave type, status, approvers, and info.",
        ],
      },
      {
        title: "How to escalate a leave request to backup approver",
        steps: [
          "Open `Leave Management` and stay on `Request Monitor`.",
          "Find a `Pending` leave request that still shows `Escalate To Backup`.",
          "Click `Escalate To Backup`.",
        ],
        outcome:
          "The pending request is moved forward to the backup approver path when the page accepts the action.",
      },
      {
        title: "How to review leave credits",
        steps: [
          "Open `Leave Management`.",
          "Switch to the `Leave Credits` tab.",
          "Choose the `Leave Type` you want to inspect.",
          "Review the `Used` and `Remaining` values for each employee.",
        ],
      },
      {
        title: "How to add or edit a leave type",
        steps: [
          "Open `Leave Management`.",
          "Switch to the `Leave Types` tab.",
          "Click `Add Leave Type` or `Edit` on an existing row.",
          "Fill in `Name`, `Max Credits`, and `Mode`.",
          "Click `Save Changes`.",
        ],
      },
    ],
    sections: [
      {
        title: "What You Can Do Here",
        bullets: [
          "Review leave activity from the administrative side.",
          "Work with leave-related controls that go beyond the employee submission page.",
          "Use the page alongside approval workflows and leave-credit context.",
        ],
      },
      {
        title: "How It Relates To Employee Leave",
        paragraphs: [
          "Employees use the Leave page to submit and track their own requests. Leave Management provides the broader operational view needed to supervise and maintain the overall leave process.",
        ],
      },
    ],
    related: [
      ["employee", "leave"],
      ["workflows", "approvals-overview"],
    ],
  },
  {
    slug: ["hr-admin", "official-business-management"],
    title: "Official Business Management",
    description:
      "Administrative workspace for reviewing official business requests.",
    categoryId: "hr-and-admin-features",
    audience: "HR/admin users",
    summary:
      "Official Business Management provides a management-oriented view of official business request activity.",
    tasks: [
      {
        title: "How to review official business requests",
        steps: [
          "Open `Official Business Management`.",
          "Use the available `User`, `Department`, `Status`, `Year`, and `Month` filters.",
          "Review the request table for pending or completed items.",
        ],
      },
    ],
    sections: [
      {
        title: "What You Can Do Here",
        bullets: [
          "Review official business requests from a broader operational perspective.",
          "Use the page alongside shared approval workflows and requester-facing tracking pages.",
        ],
      },
      {
        title: "When To Use It",
        paragraphs: [
          "Use this page when the Request Inbox is not enough and the official business workflow needs a more feature-specific review or oversight surface.",
        ],
      },
    ],
    related: [
      ["employee", "official-business"],
      ["workflows", "request-inbox"],
    ],
  },
  {
    slug: ["hr-admin", "certificate-attendance-management"],
    title: "Certificate of Attendance Management",
    description:
      "Administrative workspace for certificate attendance request review.",
    categoryId: "hr-and-admin-features",
    audience: "HR/admin users",
    summary:
      "This page is the management-side counterpart to employee certificate attendance requests.",
    tasks: [
      {
        title: "How to review certificate attendance requests",
        steps: [
          "Open `Certificate Attendance Management`.",
          "Use the available `User`, `Department`, `Status`, `Year`, and `Month` filters.",
          "Review the request rows and attendance-related details provided for each item.",
        ],
      },
    ],
    sections: [
      {
        title: "What You Can Do Here",
        bullets: [
          "Review certificate attendance requests from the administrative side.",
          "Use request details such as date, time, punch, and submitted notes to evaluate the item.",
        ],
      },
      {
        title: "Usage Notes",
        paragraphs: [
          "This page is most useful when certificate requests need focused handling beyond the unified request inbox.",
        ],
      },
    ],
    related: [
      ["employee", "certificate-of-attendance"],
      ["workflows", "request-inbox"],
    ],
  },
  {
    slug: ["hr-admin", "special-request-management"],
    title: "Special Request Management",
    description:
      "Public-safe overview of the special request management workspace.",
    categoryId: "hr-and-admin-features",
    audience: "HR/admin users",
    summary:
      "Special Request Management groups request-monitoring responsibilities that do not fit neatly into one employee self-service page.",
    tasks: [
      {
        title: "How to monitor special requests",
        steps: [
          "Open `Special Request Management`.",
          "Stay on the request monitoring view.",
          "Use the `User`, `Department`, `Status`, `Year`, and `Month` filters.",
          "Review the row details for the matching request set.",
        ],
      },
    ],
    sections: [
      {
        title: "What You Can Do Here",
        bullets: [
          "Review special-request activity from an administrative workflow view.",
          "Use the page when request monitoring needs a dedicated surface outside the general inbox.",
        ],
      },
    ],
    related: [["workflows", "request-inbox"]],
  },
  {
    slug: ["hr-admin", "trainings-management"],
    title: "Trainings Management",
    description:
      "Administrative workspace for managing training records and participation context.",
    categoryId: "hr-and-admin-features",
    audience: "HR/admin users",
    summary:
      "Trainings Management supports the administrative side of training setup, tracking, and participant-related review.",
    tasks: [
      {
        title: "How to add a training",
        steps: [
          "Open `Trainings Management`.",
          "Click `Add Training`.",
          "Enter the `Training Title`.",
          "Choose the `Training Date`.",
          "Optionally enter a `Description`.",
          "Click `Save Training`.",
        ],
        outcome:
          "The training is added to the list and can be opened for participant and attachment management.",
      },
      {
        title: "How to open a training detail page",
        steps: [
          "Open `Trainings Management`.",
          "Find the training in the table.",
          "Click `View`.",
        ],
        outcome:
          "HCMIS opens the training detail page for deeper management actions.",
      },
    ],
    sections: [
      {
        title: "What You Can Do Here",
        bullets: [
          "Review training records from a management perspective.",
          "Open deeper training detail views when one training record requires focused attention.",
          "Manage participant and training-related information exposed by the page.",
        ],
      },
      {
        title: "How It Relates To Employee Views",
        paragraphs: [
          "Employee-facing training visibility focuses on what a user can see about their own training history or assignments. This page is for the management side of the process.",
        ],
      },
    ],
    related: [
      ["employee", "trainings"],
      ["getting-started", "profile"],
    ],
  },
  {
    slug: ["hr-admin", "performance"],
    title: "Performance Management",
    description: "Public-safe overview of the HR performance workspace.",
    categoryId: "hr-and-admin-features",
    audience: "HR/admin users",
    summary: "Use this workspace to open performance-related admin pages.",
    tasks: [
      {
        title: "How to open a performance sub-module",
        steps: [
          "Open the `Performance` workspace.",
          "Review the available module cards shown on the workspace page.",
          "Click the module you need, such as evaluations, announcements, polls, or shared resources.",
        ],
        outcome: "HCMIS opens the selected performance-related workspace.",
      },
    ],
    sections: [
      {
        title: "What You Can Do Here",
        bullets: [
          "Open evaluation-related admin pages.",
          "Open communication or resource pages linked to performance work.",
        ],
      },
      {
        title: "Related Areas",
        paragraphs: [
          "This workspace is closely related to employee Performance Evaluations, Announcements and Polls, and Shared Resources management pages.",
        ],
      },
    ],
    related: [
      ["employee", "performance-evaluations"],
      ["employee", "announcements-and-polls"],
      ["hr-admin", "shared-resources"],
    ],
  },
  {
    slug: ["hr-admin", "shared-resources"],
    title: "Shared Resources Management",
    description:
      "Administrative workspace for publishing and controlling shared resource visibility.",
    categoryId: "hr-and-admin-features",
    audience: "HR/admin users",
    summary: "Use this page to upload files and control who can access them.",
    tasks: [
      {
        title: "How to upload a shared resource",
        steps: [
          "Open `Shared Resources`.",
          "Click `Upload Resource`.",
          "Optionally enter a `Resource name`.",
          "Optionally enter a `Description`.",
          "Choose a file in the `File` field.",
          "If needed, enable `Mark as confidential`.",
          "Select the users in `Shared With`.",
          "If the resource is confidential, select the users allowed in `Confidential Access`.",
          "Click `Upload`.",
        ],
        outcome: "The new resource appears in the shared resources list.",
        notes: ["The upload form only accepts files up to 10 MB."],
      },
      {
        title: "How to manage access to a resource",
        steps: [
          "Open `Shared Resources`.",
          "Find the resource in the table.",
          "Click `Manage Access`.",
          "Use `Search users` if needed.",
          "Update the `Shared With` list.",
          "If the resource is confidential, update the `Confidential Access` list.",
          "Click `Save Access`.",
        ],
        outcome: "The resource access list is updated.",
      },
      {
        title: "How to delete a resource",
        steps: [
          "Open `Shared Resources`.",
          "Find the resource in the table.",
          "Click `Delete`.",
          "If the resource is confidential, enter the exact resource name to confirm.",
          "Confirm the deletion.",
        ],
        outcome: "The resource is removed from the list if deletion succeeds.",
      },
    ],
    sections: [
      {
        title: "What You Can Do Here",
        bullets: [
          "Upload shared files.",
          "Control who can open each file.",
          "Manage confidential files when needed.",
        ],
      },
      {
        title: "How It Relates To Employee Views",
        paragraphs: [
          "Employees use their shared-resources page to consume what has already been made available. This page is where those records are managed.",
        ],
      },
    ],
    related: [
      ["employee", "shared-resources"],
      ["hr-admin", "performance"],
    ],
  },
  {
    slug: ["hr-admin", "reports"],
    title: "Reports",
    description: "Public-safe overview of report access and report hub usage.",
    categoryId: "hr-and-admin-features",
    audience: "HR/admin users",
    summary: "Use this page to run reports.",
    tasks: [
      {
        title: "How to run a report",
        steps: [
          "Open `Reports and Analytics`.",
          "Set the needed date controls such as `Selected Year`, `Selected Date`, `From Date`, or `To Date`.",
          "Review the available report buttons in `Available Reports`.",
          "Click the report you want to run, such as `Daily Staffing`, `Yearly Payroll Expense`, `User Demographics (Gender)`, or `Resignation Report`.",
        ],
        outcome:
          "The report loads in the `Report Workspace` with charts, KPIs, and detail tables.",
      },
      {
        title: "How to switch to a different report",
        steps: [
          "Stay on the reports page.",
          "Adjust the date controls if needed.",
          "Click a different report button from `Available Reports`.",
        ],
        outcome: "The workspace updates to the new report output.",
      },
    ],
    sections: [
      {
        title: "What You Can Do Here",
        bullets: [
          "Run reports for HR and admin work.",
          "Switch between report types from one page.",
        ],
      },
      {
        title: "When To Use It",
        paragraphs: [
          "Use the reports area when you need a reporting-focused view instead of a transactional management page. The exact reports available depend on the workspace configuration and the account's access level.",
        ],
      },
    ],
    related: [
      ["hr-admin", "app-logs"],
      ["payroll", "payroll-overview"],
    ],
  },
  {
    slug: ["hr-admin", "app-logs"],
    title: "App Logs",
    description: "Public-safe explanation of the application log review page.",
    categoryId: "hr-and-admin-features",
    audience: "HR/admin users",
    summary: "Use this page to review app activity logs.",
    tasks: [
      {
        title: "How to filter app logs",
        steps: [
          "Open `App Logs`.",
          "Use the `User` filter to select a specific account or keep `All Users`.",
          "Optionally choose a date in `Date (optional)`.",
          "Wait for the log list to refresh automatically or click `Refresh`.",
        ],
        outcome:
          "The table updates with log entries that match the selected filters.",
      },
      {
        title: "How to browse additional log pages",
        steps: [
          "Open `App Logs`.",
          "Review the current `Page x of y` indicator below the table.",
          "Click `Previous` or `Next` to move through the log pages.",
        ],
        outcome: "HCMIS loads the next or previous page of log records.",
      },
    ],
    sections: [
      {
        title: "What You Can Do Here",
        bullets: [
          "Review logged app activity.",
          "Use the logs when checking whether an action was recorded.",
        ],
      },
      {
        title: "Scope Notes",
        paragraphs: [
          "This help page describes the purpose of the log viewer, not the internal logging implementation or infrastructure behind it.",
        ],
      },
    ],
    related: [
      ["hr-admin", "reports"],
      ["troubleshooting", "common-access-issues"],
    ],
  },
  {
    slug: ["payroll", "payroll-overview"],
    title: "Payroll Overview",
    description:
      "High-level guide to payroll-related areas available in HCMIS.",
    categoryId: "payroll-features",
    audience: "Payroll and HR/admin users",
    summary: "Use this page to choose the payroll page you need.",
    tasks: [
      {
        title: "How to choose the correct payroll workspace",
        steps: [
          "Open `Payroll`.",
          "Review the workspace cards in the payroll hub.",
          "Open `Payslips`, `Payroll Settings`, `Salary Structure`, or `13th Month` depending on your task.",
        ],
      },
    ],
    sections: [
      {
        title: "Main Payroll Areas",
        bullets: [
          "Use `Payslips Management` for payroll records and release work.",
          "Use `Payroll Settings` and `Salary Structure` for payroll setup.",
          "Use `Thirteenth Month Management` for 13th month processing.",
        ],
      },
      {
        title: "How To Use This Section",
        paragraphs: [
          "Use this page as a starting point when you need to choose the correct payroll workspace. For record-level guidance, open the specific payroll page instead.",
        ],
      },
    ],
    related: [
      ["payroll", "payslips-management"],
      ["payroll", "payroll-settings"],
      ["payroll", "salary-structure"],
      ["payroll", "thirteenth-month-management"],
    ],
  },
  {
    slug: ["payroll", "payslips-management"],
    title: "Payslips Management",
    description:
      "Administrative workspace for payroll slip visibility and release workflow.",
    categoryId: "payroll-features",
    audience: "Payroll and HR/admin users",
    summary: "Use this page to create, review, and release payslips.",
    tasks: [
      {
        title: "How to filter payslips by employee and period",
        steps: [
          "Open `Payslips Management`.",
          "Set the `Month`, `Year`, and employee filter values.",
          "Wait for the page to reload the payroll records.",
        ],
      },
      {
        title: "How to create or refresh a payslip",
        steps: [
          "Open `Payslips Management`.",
          "Complete the create form with `Employee`, `Month`, `Year`, and `Period`.",
          "Submit the create action.",
        ],
        outcome:
          "HCMIS creates the payslip or refreshes the payroll record for that employee and period.",
      },
      {
        title: "How to release or view a payslip",
        steps: [
          "Open `Payslips Management`.",
          "Find the payslip row you need.",
          "Use the row action to open the summary dialog for review.",
          "Use the release toggle action when the payroll item is ready to become visible to the employee.",
        ],
      },
    ],
    sections: [
      {
        title: "What You Can Do Here",
        bullets: [
          "Review payslips by employee and period.",
          "See which payslips are released and unreleased.",
          "Open a payslip before releasing it.",
        ],
      },
      {
        title: "How It Relates To Employees",
        paragraphs: [
          "Employees only see payslip records that have already been made visible to their accounts. Administrative work happens from this page and other payroll workspaces.",
        ],
      },
    ],
    related: [
      ["employee", "my-payslips"],
      ["payroll", "payroll-overview"],
    ],
  },
  {
    slug: ["payroll", "payroll-settings"],
    title: "Payroll Settings",
    description: "Public-safe overview of the payroll settings workspace.",
    categoryId: "payroll-features",
    audience: "Payroll and HR/admin users",
    summary: "Use this page to update payroll setup values.",
    tasks: [
      {
        title: "How to update base salary settings",
        steps: [
          "Open `Payroll Settings`.",
          "Go to `Base Salary Settings`.",
          "Update fields like `Basic Salary`, `Salary Multiplier`, `Step Multiplier`, `Number Of Steps`, `Max Position Rank`, or `Automatic Deductions`.",
          "Click `Save Base Salary Settings`.",
        ],
      },
      {
        title: "How to create a payroll policy version",
        steps: [
          "Open `Payroll Settings`.",
          "Go to `Policy Version Setup`.",
          "Click `Create Official Version`.",
          "Fill in `Version Name` and `Effective From`.",
          "Choose `Overwrite Existing Version` only when you mean to replace a same-named version.",
          "Save the new policy version.",
        ],
      },
      {
        title: "How to manage MP2 enrollment records",
        steps: [
          "Open `Payroll Settings`.",
          "Go to the MP2 section.",
          "Use the employee search and `Status` filter to find the record you need.",
          "Create or edit the enrollment from the page dialog when needed.",
        ],
      },
    ],
    sections: [
      {
        title: "What You Can Do Here",
        bullets: [
          "Update payroll settings shown in the app.",
          "Work on setup values outside the payslip pages.",
        ],
      },
      {
        title: "Scope Limits",
        paragraphs: [
          "This public documentation explains the feature purpose only. It does not describe internal calculation engines, private source rules, or backend implementation details.",
        ],
      },
    ],
    related: [
      ["payroll", "payroll-overview"],
      ["payroll", "salary-structure"],
    ],
  },
  {
    slug: ["payroll", "salary-structure"],
    title: "Salary Structure",
    description: "Public-safe overview of salary structure management.",
    categoryId: "payroll-features",
    audience: "Payroll and HR/admin users",
    summary: "Use this page to manage positions and salary grades.",
    tasks: [
      {
        title: "How to add a position",
        steps: [
          "Open `Salary Structure`.",
          "Click `Add Position`.",
          "Enter `Title`, `Code`, `Salary Grade`, and the matching `Departments`.",
          "Set the `Active` checkbox as needed.",
          "Click `Save`.",
        ],
        outcome: "The new position appears in the salary structure table.",
      },
      {
        title: "How to edit or deactivate a position",
        steps: [
          "Open `Salary Structure`.",
          "Find the position row.",
          "Click `Edit` to update it, or `Deactivate` if the position should no longer be active.",
        ],
      },
    ],
    sections: [
      {
        title: "What You Can Do Here",
        bullets: [
          "Review position records.",
          "Add or update salary structure entries used by payroll.",
        ],
      },
      {
        title: "Why It Matters",
        paragraphs: [
          "Salary structure influences how payroll administrators organize and interpret compensation records in the application, even when the actual calculation details are handled elsewhere.",
        ],
      },
    ],
    related: [
      ["payroll", "payroll-settings"],
      ["payroll", "payroll-overview"],
    ],
  },
  {
    slug: ["payroll", "thirteenth-month-management"],
    title: "Thirteenth Month Management",
    description:
      "Administrative workspace for thirteenth month generation, review, and release steps.",
    categoryId: "payroll-features",
    audience: "Payroll and HR/admin users",
    summary:
      "Use this page to generate, review, and release 13th month payouts.",
    tasks: [
      {
        title: "How to generate thirteenth month payouts",
        steps: [
          "Open `13th Month Payouts`.",
          "Choose the `Year` you want to process.",
          "Click `Generate`.",
        ],
        outcome:
          "HCMIS creates or refreshes the payout records for the selected year.",
      },
      {
        title: "How to review or release a payout",
        steps: [
          "Open `13th Month Payouts`.",
          "Use `Search Employee` if you need to narrow the list.",
          "Click `Manage` on an unreleased row or `View` on a released row.",
          "Click `Release` on the row when the payout is ready to be published to the employee.",
        ],
      },
      {
        title: "How to add a payout adjustment",
        steps: [
          "Open a payout through `Manage`.",
          "In `Manage 13th Month Adjustments`, choose the adjustment `Type`.",
          "Fill in `Label`, `Amount`, and optional reason fields.",
          "Save the adjustment.",
        ],
      },
    ],
    sections: [
      {
        title: "What You Can Do Here",
        bullets: [
          "Review 13th month records by employee.",
          "Generate payouts, make adjustments, and release them.",
        ],
      },
      {
        title: "Relationship To Employee View",
        paragraphs: [
          "Employees use My Thirteenth Month only to view what is already visible to them. Administrative activity happens here.",
        ],
      },
    ],
    related: [
      ["employee", "my-thirteenth-month"],
      ["payroll", "payroll-overview"],
    ],
  },
  {
    slug: ["attendance-biometric", "attendance-overview"],
    title: "Attendance Overview",
    description:
      "Shared explanation of attendance-related concepts used across employee and HR pages.",
    categoryId: "attendance-and-biometric",
    audience: "Employees and HR/admin users",
    summary: "This page explains the basic attendance ideas used in HCMIS.",
    tasks: [
      {
        title: "How to use this attendance guide",
        steps: [
          "Start with this page when you need to understand how attendance, schedules, shifts, and holidays connect.",
          "Open the employee or HR attendance page that matches your role after confirming the basic concept here.",
          "If the issue involves biometric mismatch, continue to the biometric sync or reconciliation guide.",
        ],
        outcome: "You can decide which attendance-related page to use next.",
      },
    ],
    sections: [
      {
        title: "Core Concepts",
        bullets: [
          "Attendance records show what HCMIS currently recognizes for recorded work-related time entries.",
          "Shifts, schedules, departments, and holidays provide context for how attendance is viewed and interpreted.",
          "Employee pages focus on one person's record, while HR pages support broader operational review.",
        ],
      },
      {
        title: "How To Use This Guide",
        paragraphs: [
          "Use this page when the relationship between attendance, scheduling, and biometric-related workflows is unclear. It is a shared reference, not a transactional screen.",
        ],
      },
    ],
    related: [
      ["employee", "attendance"],
      ["hr-admin", "attendance-management"],
      ["hr-admin", "shift-management"],
    ],
  },
  {
    slug: ["attendance-biometric", "biometric-reconciliation"],
    title: "Biometric Reconciliation",
    description:
      "Public-safe explanation of how HCMIS presents app-versus-biometric mismatches.",
    categoryId: "attendance-and-biometric",
    audience: "HR/admin users and public readers",
    summary:
      "Biometric Reconciliation focuses on understanding mismatches between what exists in HCMIS and what exists in the biometric source.",
    tasks: [
      {
        title: "How to review a biometric mismatch",
        steps: [
          "Open the biometric comparison workflow.",
          "Identify whether the row exists in the app, the biometric source, or both.",
          "If the row exists only in the biometric source and a create action is available, create the app user from that row.",
          "If the row exists in both places, compare the visible names and identifiers before taking follow-up action.",
        ],
        outcome:
          "You can classify the mismatch and choose the correct next step inside HCMIS.",
      },
    ],
    sections: [
      {
        title: "What Reconciliation Means",
        bullets: [
          "A record can exist in the application, in the biometric source, or in both.",
          "Mismatch views help administrators identify missing or unmatched records rather than resolve everything automatically.",
          "The workflow is intentionally review-oriented before any follow-up action is taken.",
        ],
      },
      {
        title: "Typical Outcomes",
        paragraphs: [
          "A common case is a biometric record with no matching app user. In that case, the sync page can expose a Create App User action from the application side. Other cases may simply require review and confirmation rather than immediate action.",
        ],
      },
      {
        title: "Scope Limits",
        paragraphs: [
          "This public page explains reconciliation as an application workflow, not as a device or bridge deployment procedure.",
        ],
      },
    ],
    related: [
      ["attendance-biometric", "biometric-sync-overview"],
      ["hr-admin", "users"],
    ],
  },
  {
    slug: ["troubleshooting", "common-access-issues"],
    title: "Common Access Issues",
    description:
      "Help for sign-in problems, missing access, and general navigation issues.",
    categoryId: "troubleshooting",
    audience: "All visitors",
    summary:
      "Use this page when the main issue is getting into HCMIS or reaching the page you expected to use.",
    tasks: [
      {
        title: "How to handle a sign-in loop or unexpected redirect",
        steps: [
          "Return to the login page and try signing in again.",
          "If HCMIS sends you to `Change Password`, complete that step first.",
          "If you are returned to login again, confirm you are using the correct account identifier and password.",
          "If the same behavior continues, contact the appropriate support contact with the exact error or redirect behavior.",
        ],
      },
      {
        title: "How to handle a missing page or workspace",
        steps: [
          "Check the sidebar and dashboard again after signing in.",
          "Confirm whether the page may depend on your role or assigned capabilities.",
          "If you should have access and the page is still missing, escalate it to the appropriate administrator.",
        ],
      },
    ],
    sections: [
      {
        title: "Typical Problems",
        bullets: [
          "You are returned to the sign-in page unexpectedly.",
          "You are redirected to Change Password instead of Dashboard.",
          "A page described in documentation does not appear in your sidebar or dashboard.",
          "A notification exists, but it does not open the page you expected.",
        ],
      },
      {
        title: "What To Check First",
        bullets: [
          "Confirm whether your session has expired and you need to sign in again.",
          "Confirm whether your account currently requires a password change.",
          "Confirm whether the missing page may depend on role or capabilities not assigned to your account.",
        ],
      },
      {
        title: "When To Escalate",
        paragraphs: [
          "Escalate the issue when the behavior blocks access to a page you should legitimately have, or when repeated sign-in attempts still fail with the same error.",
        ],
      },
    ],
    related: [
      ["getting-started", "login"],
      ["getting-started", "change-password"],
      ["getting-started", "notifications"],
    ],
  },
  {
    slug: ["troubleshooting", "request-issues"],
    title: "Request Issues",
    description:
      "Help for requests that seem stuck, missing, or unclear in the workflow.",
    categoryId: "troubleshooting",
    audience: "Employees and approvers",
    summary:
      "Use this page when a leave, overtime, official business, or certificate request does not behave as expected.",
    tasks: [
      {
        title: "How to check a request that seems stuck",
        steps: [
          "Open `Request Inbox` or the related request page.",
          "Find the request and confirm the current status.",
          "Check whether the request is still assigned to the current approver or already resolved.",
          "If the item is still pending and the expected approver cannot act, escalate through the correct admin process.",
        ],
      },
      {
        title: "How to check why you cannot act on a request",
        steps: [
          "Open the request row in `Request Inbox`.",
          "Confirm the request is still `Pending`.",
          "Check whether your account is the active approver for that stage.",
          "If action buttons are missing, the request may belong to another approver or no longer be actionable by you.",
        ],
      },
    ],
    sections: [
      {
        title: "Typical Problems",
        bullets: [
          "A request remains pending longer than expected.",
          "A request cannot be cancelled.",
          "You can view a request but do not see approve or reject actions.",
          "The status is visible but the meaning is unclear.",
        ],
      },
      {
        title: "What To Check First",
        bullets: [
          "Review the Request Inbox to confirm the current request state.",
          "Check whether the request is still assigned to you in the active stage or is waiting on another approver.",
          "Use the Status Guide to confirm whether the request is still actionable or already resolved.",
        ],
      },
      {
        title: "When To Escalate",
        paragraphs: [
          "Escalate the issue when a request appears stuck despite still being active, or when the page behavior conflicts with the current user's expected role in the workflow.",
        ],
      },
    ],
    related: [
      ["workflows", "request-inbox"],
      ["workflows", "approvals-overview"],
      ["workflows", "status-guide"],
    ],
  },
  {
    slug: ["troubleshooting", "attendance-and-payroll-issues"],
    title: "Attendance and Payroll Issues",
    description:
      "Help for mismatches involving attendance visibility, payslips, and thirteenth month records.",
    categoryId: "troubleshooting",
    audience: "Employees and HR/admin users",
    summary:
      "Use this page when the issue involves attendance visibility, payroll release state, or expected payroll-related records not appearing.",
    tasks: [
      {
        title: "How to check a missing payslip or payout record",
        steps: [
          "Open the relevant employee payroll page such as `My Payslips` or `My 13th Month Payouts`.",
          "Confirm the correct period or year.",
          "Check whether the item may still be unreleased rather than missing.",
          "If a released item still does not appear, escalate it through payroll support.",
        ],
      },
      {
        title: "How to check an attendance mismatch",
        steps: [
          "Open the attendance page for the relevant period.",
          "Confirm the date, schedule context, and visible records.",
          "If the issue appears tied to biometric data, review the biometric sync or reconciliation guidance.",
          "Escalate the issue if the mismatch remains after basic review and affects payroll or compliance outcomes.",
        ],
      },
    ],
    sections: [
      {
        title: "Typical Problems",
        bullets: [
          "Attendance records appear missing or incomplete.",
          "A payslip does not appear in the employee view.",
          "A thirteenth month record is missing or still not visible.",
          "Biometric and attendance views appear inconsistent.",
        ],
      },
      {
        title: "What To Check First",
        bullets: [
          "Confirm the correct period, date range, or release state.",
          "Check whether the item belongs to an unreleased payroll workflow rather than a missing record.",
          "Review the biometric sync or attendance overview pages when the issue seems to be caused by upstream record mismatch.",
        ],
      },
      {
        title: "When To Escalate",
        paragraphs: [
          "Escalate when a released payroll item is still missing, when attendance remains inconsistent after basic review, or when the discrepancy has a real downstream payroll or compliance impact.",
        ],
      },
    ],
    related: [
      ["employee", "attendance"],
      ["employee", "my-payslips"],
      ["employee", "my-thirteenth-month"],
      ["attendance-biometric", "biometric-sync-overview"],
    ],
  },
] as const satisfies readonly DocPage[];

export const docsCategories = categories;
export const docsPages = pages;
const docsPagesFlat = [...docsPages];

export function getDocCategory(categoryId: DocCategoryId) {
  return docsCategories.find((category) => category.id === categoryId);
}

export function getDocHref(slug: readonly string[]) {
  if (slug.length === 0) {
    return "/docs";
  }

  return `/docs/${slug.join("/")}`;
}

export function getDocBySlug(slug: readonly string[]) {
  return docsPagesFlat.find(
    (page) =>
      page.slug.length === slug.length &&
      page.slug.every((part, index) => part === slug[index]),
  );
}

export function getCategoryPages(categoryId: DocCategoryId) {
  return docsPagesFlat.filter((page) => page.categoryId === categoryId);
}
