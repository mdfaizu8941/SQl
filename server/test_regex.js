const text = `{"sql": "CREATE TABLE users ( id UUID PRIMARY KEY DEFAULT gen_random_uuid(), username VARCHAR(255) UNIQUE NOT NULL, email VARCHAR(255) UNIQUE NOT NULL, password_hash VARCHAR(255) NOT NULL, created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP );", "explanation": "Creates a users table with a UUID primary key, unique username and email, a password_hash field, and timestamps for creation and updates.", "tables": ["users"]}`;

const jsonMatch = text.match(/\{[\s\S]*\}/);
if (!jsonMatch) {
  console.log("NO MATCH");
} else {
  console.log("MATCH", jsonMatch[0]);
  try {
    JSON.parse(jsonMatch[0]);
    console.log("PARSED SUCCESSFULLY");
  } catch(e) {
    console.log("PARSE ERROR", e);
  }
}
