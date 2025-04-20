// templates/accountCreatedTemplate.js
const accountCreatedTemplate = ({ name, email, password }) => `
  <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #333; max-width: 600px; margin: auto;">
  <p>Dear <strong>${name}</strong>,</p>

  <p>
    We hope this message finds you well. The Department of Engineering at MET is pleased to introduce 
    <strong>Probit</strong> — a platform designed to simplify and enhance the management of academic projects for both students and faculty.
  </p>

  <p>
    <strong>Probit</strong> includes a range of features to support project workflow:
  </p>

  <ul>
    <li>Student Registration and Group Formation</li>
    <li>Project Topic Submission and Faculty Review</li>
    <li>Guide and Panel Assignments</li>
    <li>Upload of Abstracts and Final Reports</li>
    <li>Project Progress and Task Tracking</li>
    <li>Issue Reporting and Communication</li>
    <li>Automated Report Compilation and Similarity Checks</li>
  </ul>

  <p>Your Probit account has been successfully created. Below are your login details:</p>

  <ul>
    <li><strong>Email ID:</strong> ${email}</li>
    <li><strong>Temporary Access Code:</strong> ${password}</li>
  </ul>

  <p>
    Please use the following link to access your account and complete your registration:
    <br />
    <a href="https://main.dnfwop90kvj3i.amplifyapp.com" style="color: #1a73e8;">Login</a>
  </p>

  
  <p>The following modules are currently live for initial testing:</p>
  <ul>
    <li>Student Registration</li>
    <li>Abstract Submission</li>
  </ul>

  <p>
    Your participation and feedback are crucial in refining the platform. Please share your suggestions and report any issues using the links below:
  </p>

  <p>
    <a href="https://forms.gle/Hcd6LRzKYxddUVze7">Feedback Form</a>
  </p>

  <p>
    <a href="https://forms.gle/M4XJAopDzH59Xg9C8">Report an Issue</a>
  </p>

  <hr style="border: none; border-top: 1px solid #ccc;" />

  <p style="font-size: 0.9em; color: #555;">
    This email was sent to you by the Probit Development Team, Department of Engineering, MET College.<br />
    For assistance, contact us at <a href="mailto:probit247@gmail.com" style="color: #1a73e8;">probit247@gmail.com</a><br />
    MET College, Engineering Block, Nashik – 422003
  </p>

  <p style="font-size: 0.8em; color: #888;">
    If you do not wish to receive further emails regarding Probit, please reply with "Unsubscribe" in the subject line.
  </p>
</div>
`;

export default accountCreatedTemplate;