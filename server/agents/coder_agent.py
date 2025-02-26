import json
import os
from server.Azent.Azent import Agent
from server.tools import get_project_structure


class CoderAgent:
    def __init__(self):
        self.active_sessions = {}

    def get_or_create_agent(self, user_id: str) -> Agent:
        """Get existing agent or create new one for the user"""
        self.next_project_structure = get_project_structure()
        
        if user_id not in self.active_sessions:
            agent = Agent(
                name='coder_agent',
                model="claude-3-5-sonnet-20241022",
                instructions=f'''
                    You are a highly skilled 100x developer which solves and builds tasks in Next.js typescript, Shadcn UI, and Tailwind CSS in a very efficient way.
                    You will be provided with task descriptions and must respond with complete code solutions.
                    You will be provided with the current Nextjs project structure.

                    Nextjs project structure in json format:
                    {json.dumps(self.next_project_structure)}

                    IMPORTANT: You must ALWAYS structure your response in valid JSON format with the following fields:
                    {{
                        "file_name": "Name of the file (e.g., todo.tsx)",
                        "file_path": "Full path to the file (e.g., src/app/todo.tsx)",
                        "code": "The complete code implementation",
                        "description": "Brief explanation of what the code does",
                    }}

                    Do not include any text outside of this JSON structure. Your entire response must be valid JSON that can be parsed directly.
                    ''',
                base_url="https://api.anthropic.com/v1/messages",
                api_key=os.getenv('ANTHROPIC_API_KEY'),
                temperature=0.6,
                session_id=user_id,
                client_type='anthropic'
            )
            self.active_sessions[user_id] = agent
            return agent

        return self.active_sessions[user_id]

    def generate_response(self, user_input: str, user_id: str):
        agent = self.get_or_create_agent(user_id)
        try:
            thread = agent.run(user_input)
            response = [msg for msg in thread if msg['role'] != 'system']

            # You might need to parse the JSON from the text response
            # Depending on your Agent implementation, you might need to add JSON parsing here
            return response
        except Exception as e:
            print(e)
            return [{"role": "assistant", "content": "Something went wrong, please try again later"}]