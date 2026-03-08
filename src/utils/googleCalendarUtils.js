// src/utils/googleCalendarUtils.js
// Calendar and Drive utility functions - Only call these after GAPI is initialized and user is signed in
import { gapi } from 'gapi-script';

/**
 * 🚨 CRITICAL SAFETY CHECK: Ensure GAPI is ready before any API calls
 */
const ensureGapiReady = () => {
  if (!window.gapi) {
    throw new Error('Google API (gapi) not loaded');
  }
  if (!window.gapi.client) {
    throw new Error('Google API client not initialized');
  }
  if (!window.gapi.auth2) {
    throw new Error('Google Auth2 not available');
  }
  return true;
};

/**
 * List upcoming Calendar events
 * @param {number} maxResults - Maximum number of events to return (default: 10)
 */
export async function listUpcomingEvents(maxResults = 10) {
  // 🚨 CRITICAL: Never call without GAPI being ready
  ensureGapiReady();

  try {
    const response = await gapi.client.calendar.events.list({
      calendarId: "primary",
      timeMin: new Date().toISOString(),
      showDeleted: false,
      singleEvents: true,
      maxResults,
      orderBy: "startTime",
    });
    return response.result.items || [];
  } catch (error) {
    console.error("Error fetching calendar events:", error);
    throw new Error(`Failed to fetch calendar events: ${error.message}`);
  }
}

/**
 * Create a new Calendar event
 * @param {object} eventData - Event data object
 */
export async function createCalendarEvent(eventData) {
  ensureGapiReady();

  try {
    const response = await gapi.client.calendar.events.insert({
      calendarId: "primary",
      resource: eventData,
    });
    return response.result;
  } catch (error) {
    console.error("Error creating calendar event:", error);
    throw new Error(`Failed to create calendar event: ${error.message}`);
  }
}

/**
 * List Drive files
 * @param {number} maxResults - Maximum number of files to return (default: 10)
 */
export async function listDriveFiles(maxResults = 10) {
  ensureGapiReady();

  try {
    const response = await gapi.client.drive.files.list({
      pageSize: maxResults,
      fields: "nextPageToken, files(id, name, mimeType, modifiedTime)",
    });
    return response.result.files || [];
  } catch (error) {
    console.error("Error fetching Drive files:", error);
    throw new Error(`Failed to fetch Drive files: ${error.message}`);
  }
}

/**
 * Upload file to Google Drive
 * @param {File|Blob} fileData - File data
 * @param {string} fileName - Name for the file
 */
export async function uploadToDrive(fileData, fileName) {
  ensureGapiReady();

  try {
    const response = await gapi.client.drive.files.create({
      resource: {
        name: fileName,
      },
      media: {
        mimeType: fileData.type,
        body: fileData,
      },
    });
    return response.result;
  } catch (error) {
    console.error("Error uploading to Drive:", error);
    throw new Error(`Failed to upload to Drive: ${error.message}`);
  }
}

/**
 * Check if user is signed in to Google
 */
export function isGoogleSignedIn() {
  try {
    ensureGapiReady();
    return gapi.auth2.getAuthInstance().isSignedIn.get();
  } catch (error) {
    console.error("Error checking Google sign-in status:", error);
    return false;
  }
}

/**
 * Get current Google user profile
 */
export async function getGoogleUserProfile() {
  ensureGapiReady();

  try {
    const authInstance = gapi.auth2.getAuthInstance();
    const user = authInstance.currentUser.get();
    const profile = user.getBasicProfile();
    return {
      id: profile.getId(),
      name: profile.getName(),
      email: profile.getEmail(),
      imageUrl: profile.getImageUrl(),
    };
  } catch (error) {
    console.error("Error getting Google user profile:", error);
    throw new Error(`Failed to get Google user profile: ${error.message}`);
  }
}
