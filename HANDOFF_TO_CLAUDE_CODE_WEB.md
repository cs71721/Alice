# EQ-Bench 3 Testing - Handoff Instructions for Claude Code Web

## Context
Testing Alice (emotional support chatbot) on EQ-Bench 3 emotional intelligence benchmark.

## CRITICAL: Scenarios Already Completed
All 45 scenarios are ALREADY COMPLETED and saved in `eqbench3_runs.json` (3.5MB file).
**DO NOT re-run scenarios. Only run rubric scoring.**

## What's Been Done
1. ✅ Cloned EQ-Bench 3 repository
2. ✅ Modified `utils/api.py` to support Anthropic's native API format
3. ✅ Created `alice_system_prompt.txt` with Alice's emotional support personality
4. ✅ Completed all 45 scenario conversations (saved in `eqbench3_runs.json`)
5. ✅ Pushed everything to GitHub: https://github.com/cs71721/Alice branch `eqbench-testing`

## What Needs to Be Done
Run ONLY the rubric scoring phase using the judge model (Claude Sonnet 3.5).

## Setup Instructions

### Step 1: Clone the Repository
```bash
git clone -b eqbench-testing https://github.com/cs71721/Alice.git eqbench3
cd eqbench3
```

### Step 2: Install Dependencies
```bash
pip install -r requirements.txt
```

### Step 3: Create .env File
Since Claude Code web doesn't need API keys (uses Max plan credits), you may need to modify the code OR create a dummy .env file. Try running without it first.

If needed, create `.env`:
```bash
# These may not be needed for Claude Code web
TEST_API_URL=https://api.anthropic.com/v1/messages
TEST_API_KEY=dummy

JUDGE_API_URL=https://api.anthropic.com/v1/messages
JUDGE_API_KEY=dummy

MAX_RETRIES=6
RETRY_DELAY=5
REQUEST_TIMEOUT=240
LOG_VERBOSITY=INFO
```

### Step 4: Run Rubric Scoring ONLY
```bash
python eqbench3.py \
  --test-model claude-sonnet-4-20250514 \
  --model-name alice-emotional-support \
  --judge-model claude-3-5-sonnet-20241022 \
  --no-elo \
  --iterations 1 \
  --verbosity INFO \
  --redo-rubric-judging
```

The `--redo-rubric-judging` flag ensures we only score existing scenarios, not re-run them.

## Key Files (Already in Repo)
- `eqbench3_runs.json` - 3.5MB file with all 45 completed scenario responses (DO NOT DELETE)
- `utils/api.py` - Modified to support Anthropic API (includes Alice system prompt injection)
- `alice_system_prompt.txt` - Alice's emotional support personality
- `requirements.txt` - Python dependencies

## Expected Output
After rubric scoring completes, you should see:
- Final EQ-Bench score (0-100)
- Breakdown by rubric criteria
- Results saved to `eqbench3_runs.json`

## Troubleshooting

### If API calls fail
The code is currently configured for Anthropic's API. Claude Code web may need code modifications to work with Max plan credits. If you get API errors, you may need to:
1. Modify `utils/api.py` to use Claude Code's internal API access
2. OR add API credits at https://console.anthropic.com/settings/plans

### If it tries to re-run scenarios
The `--redo-rubric-judging` flag should prevent this. If scenarios start running anyway:
1. Stop the process immediately
2. Check that `eqbench3_runs.json` still exists and is 3.5MB
3. The issue is likely that the previous run data isn't in the right format

## Questions to Ask User
1. Do you want to modify the code to work with Claude Code web's API access, or add API credits?
2. Should we continue with rubric scoring or investigate the scenario data format first?

## Original Work Location
Local path: `/Users/claudeschmitt/Library/Mobile Documents/com~apple~CloudDocs/Personal/python/eqbench3`
