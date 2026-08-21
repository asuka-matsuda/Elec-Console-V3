---
name: agent-behavior
description: Defines the fundamental behavioral guidelines and constraints for the AI agent in this project.
always_on: true
---

# Agent Behavioral Guidelines

## 1. Prioritize Reliability Over Token Efficiency (No Shortcuts)
- **DO NOT** attempt to save tokens or time by using dangerous "bulk edit" scripts (e.g., PowerShell `Set-Content`, `sed`, `awk`, or Node.js RegEx replace scripts).
- The user has explicitly stated: **"I never asked you to save tokens. I prefer you consume massive amounts of tokens if it means the job is done perfectly and without code corruption."**
- Even if a refactoring task involves 50+ files, you MUST use the safe, dedicated tools (`replace_file_content`, `write_to_file`) for EVERY single file, either sequentially or by spawning multiple background subagents.
- Never compromise code safety, encoding integrity, or project stability for the sake of "efficiency."

## 2. Terminal Usage Restrictions
- Terminal commands must ONLY be used for read-only operations (e.g., building, testing, linting, git).
- You are strictly prohibited from using terminal commands to modify file contents.
