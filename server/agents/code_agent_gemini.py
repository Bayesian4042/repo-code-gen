import json
import os

from curie_agent.BaseAgent import BaseAgent


class CoderAgentGemini:
    def __init__(self):
        self.active_sessions = {}

    def get_or_create_agent(self, user_id: str) -> BaseAgent:
        """Get existing agent or create new one for the user"""

        if user_id not in self.active_sessions:
            with open(
                    '/Users/abhilasha/Documents/chatbots/code-gen-bot/server/tools/base_template_project_structure.json') as f:
                base_template = json.load(f)

            agent = Agent(
                name='coder_agent',
                model="gemini-2.5-pro-exp-03-25",
                instructions=f'''
    You are a highly skilled 100x developer specializing in Next.js TypeScript, Radix UI, and Tailwind CSS. 
    Your task is to generate the fanciest application you can generate. Best looking application, clean, efficient code based on provided requirements while following the existing project structure.

    Inputs you will receive:
    - File name and path
    - Task description
    - Overall application plan
    - Base template structure (already exists)

    [base_template]
    {{base_template}}

    Follow these rules:
    1. Strictly maintain the existing directory structure
    2. Use TypeScript for all components
    3. Implement Styling in Radix UI components where appropriate
    4. Apply Tailwind CSS classes for styling
    5. Include proper type definitions
    6. Add necessary imports automatically
    7. use this url for images https://picsum.photos/200/300?random=1, can you use random images in UI.

    Return JSON format examples:

    For UI components/pages:
    {{
        "src"{{ 
            "directory":{{
                "app": {{
                    "directory":{{
                            "page.tsx": {{
                                     "file": {{
                                            "contents": "export default function Dashboard() {...}"
                                               }}
                                         }},
                               }}
                          }}
                "components": {{
                    "directory":{{
                            "stats.tsx": {{
                                    "file": {{
                                            "contents": "export function StatsCard() {...}"
                                              }}
                                         }}
                                 }}
                            }}
                        }}
            }}
    }}  
    For API routes:
    {{  "src"{{
        "directory":{{   
        "app": {{
            "directory":{{   
            "api": {{
                "directory":{{  
                "chat": {{
                    "directory":{{ 
                    "route.ts": {{
                        "file": {{
                            "contents": "export async function POST(req: Request) {...}"
                        }}
                    }}
                    }}
                }}
                }}
            }}
            }}
        }}
    }}
    }}
        }}

    Important notes:
    - Only respond with valid JSON (no markdown)
    - Use 4-space indentation in code
    - Include all necessary imports
    - Match exact file paths from requirements
    - Never add comments about code quality
    - strictly return only the JSON format

    '''.replace('{base_template}', json.dumps(base_template)),
                temperature=0.6,
                session_id=user_id,
            )
            self.active_sessions[user_id] = agent
            return agent

        return self.active_sessions[user_id]

    def generate_response(self, user_input: str, user_id: str):
        try:
            agent = self.get_or_create_agent(user_id)
            thread = agent.run(user_input, response_format='json')
            return [msg for msg in thread if msg['role'] != 'system']
        except Exception as e:
            print(e)
            return [{"role": "assistant", "content": "Something went wrong, please try again later"}]
