#!/usr/bin/env python3
"""
Automated testing script for ChatGPT Custom GPTs on EQ-Bench 3
Requires: playwright (pip install playwright)
Run: playwright install chromium (first time only)
"""

import json
import asyncio
import logging
import os
import time
from pathlib import Path
from playwright.async_api import async_playwright
from datetime import datetime

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

class CustomGPTTester:
    def __init__(self, gpt_url, scenarios_file="data/scenario_prompts.txt"):
        self.gpt_url = gpt_url
        self.scenarios_file = scenarios_file
        self.responses = []
        self.scenarios = []

    def load_scenarios(self):
        """Load EQ-Bench scenarios from file"""
        with open(self.scenarios_file, 'r') as f:
            content = f.read()

        # Parse scenarios (simplified - you may need to adjust based on actual format)
        scenario_blocks = content.split('\n\n')
        for block in scenario_blocks:
            if block.strip() and 'User:' in block:
                # Extract the user prompts from each scenario
                lines = block.split('\n')
                scenario = {'messages': []}
                for line in lines:
                    if line.startswith('User:'):
                        scenario['messages'].append({
                            'role': 'user',
                            'content': line.replace('User:', '').strip()
                        })
                if scenario['messages']:
                    self.scenarios.append(scenario)

        logging.info(f"Loaded {len(self.scenarios)} scenarios")
        return len(self.scenarios) > 0

    async def test_scenario(self, page, scenario, scenario_num):
        """Test a single scenario through the web interface"""
        responses_for_scenario = []

        for i, message in enumerate(scenario['messages']):
            logging.info(f"Scenario {scenario_num}, Message {i+1}: Sending user message")

            # Find the input field and send message
            input_selector = 'textarea[placeholder*="Message"], div[contenteditable="true"]'
            await page.wait_for_selector(input_selector, timeout=10000)
            input_field = page.locator(input_selector)

            # Clear and type the message
            await input_field.click()
            await input_field.fill(message['content'])

            # Send the message (Enter key or send button)
            await page.keyboard.press('Enter')

            # Wait for response to start appearing
            await asyncio.sleep(2)

            # Wait for response to complete (look for stop generating button to disappear)
            try:
                # Wait for the response to finish generating
                await page.wait_for_function(
                    """() => {
                        const buttons = document.querySelectorAll('button');
                        const stopButton = Array.from(buttons).find(b =>
                            b.textContent.includes('Stop') ||
                            b.textContent.includes('generating')
                        );
                        return !stopButton;
                    }""",
                    timeout=60000  # 60 second timeout for response
                )
            except:
                logging.warning(f"Timeout waiting for response completion")

            # Extract the latest assistant response
            await asyncio.sleep(1)  # Brief pause to ensure DOM is updated

            # Get all message elements (adjust selector based on actual ChatGPT DOM)
            messages = await page.query_selector_all('div[data-message-author-role="assistant"], div.markdown')

            if messages:
                # Get the last assistant message
                last_response = await messages[-1].inner_text()
                responses_for_scenario.append({
                    'role': 'assistant',
                    'content': last_response
                })
                logging.info(f"Captured response (length: {len(last_response)} chars)")
            else:
                logging.error("Could not find assistant response")
                responses_for_scenario.append({
                    'role': 'assistant',
                    'content': "[ERROR: Could not capture response]"
                })

            # Small delay between messages in a conversation
            await asyncio.sleep(2)

        return responses_for_scenario

    async def run_tests(self, headless=False):
        """Run all scenarios through the custom GPT"""
        async with async_playwright() as p:
            # Launch browser
            browser = await p.chromium.launch(headless=headless)
            context = await browser.new_context()
            page = await context.new_page()

            # Navigate to the custom GPT
            logging.info(f"Navigating to {self.gpt_url}")
            await page.goto(self.gpt_url)

            # Wait for page to load and check if login is needed
            await asyncio.sleep(3)

            # Check if we need to log in
            if "auth0" in page.url or "login" in page.url:
                logging.warning("Login required. Please log in manually in the browser window.")
                logging.warning("After logging in, press Enter here to continue...")
                if not headless:
                    input()  # Wait for user to complete login
                else:
                    logging.error("Cannot proceed with headless mode - login required")
                    await browser.close()
                    return False

            # Test each scenario
            for i, scenario in enumerate(self.scenarios, 1):
                logging.info(f"\n{'='*50}")
                logging.info(f"Testing Scenario {i}/{len(self.scenarios)}")
                logging.info(f"{'='*50}")

                # Start a new conversation for each scenario
                # Look for "New chat" button or similar
                try:
                    new_chat_button = page.locator('a[href="/"], button:has-text("New chat")')
                    if await new_chat_button.count() > 0:
                        await new_chat_button.first.click()
                        await asyncio.sleep(2)
                except:
                    logging.warning("Could not find new chat button - continuing with existing conversation")

                # Run the scenario
                scenario_responses = await self.test_scenario(page, scenario, i)

                self.responses.append({
                    'scenario_num': i,
                    'messages': scenario['messages'],
                    'responses': scenario_responses
                })

                # Save progress periodically
                if i % 5 == 0:
                    self.save_results(f"custom_gpt_responses_partial_{i}.json")

                # Delay between scenarios to avoid rate limiting
                await asyncio.sleep(3)

            await browser.close()
            return True

    def save_results(self, filename=None):
        """Save the collected responses to a JSON file"""
        if filename is None:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"custom_gpt_responses_{timestamp}.json"

        output_path = Path(filename)
        with open(output_path, 'w') as f:
            json.dump({
                'gpt_url': self.gpt_url,
                'test_time': datetime.now().isoformat(),
                'scenarios_count': len(self.scenarios),
                'responses': self.responses
            }, f, indent=2)

        logging.info(f"Results saved to {output_path}")
        return output_path

async def main():
    # URL of your custom GPT
    GPT_URL = "https://chatgpt.com/g/g-69120060158c81919737b45cb601fef6-alice-the-reflective-chatbot"

    # Create tester instance
    tester = CustomGPTTester(GPT_URL)

    # Load scenarios
    if not tester.load_scenarios():
        logging.error("Failed to load scenarios")
        return

    # Run tests (set headless=False to see the browser)
    logging.info("Starting automated testing...")
    logging.info("Note: Set headless=False in run_tests() to watch the browser")

    success = await tester.run_tests(headless=False)  # Show browser for debugging

    if success:
        # Save results
        output_file = tester.save_results()
        logging.info(f"Testing complete! Results saved to {output_file}")

        # Now these results can be fed into the EQ-Bench scoring system
        print("\nNext steps:")
        print("1. Review the captured responses in the output JSON file")
        print("2. Convert the format to match EQ-Bench requirements")
        print("3. Run the scoring algorithm on the responses")
    else:
        logging.error("Testing failed")

if __name__ == "__main__":
    asyncio.run(main())