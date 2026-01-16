# Git Instructions: How to Commit and Push to GitHub

Here is a step-by-step guide to saving your changes (committing) and uploading them to GitHub (pushing) using the terminal.

## 1. Check Your Status
Before committing, it is good practice to see which files have been modified.
```bash
git status
```
*Red files are modified but not staged. Green files are staged and ready to commit.*

## 2. Add Your Changes
You need to "stage" the files you want to include in your commit.

**To add ALL changed files (most common):**
```bash
git add .
```

**To add a specific file only:**
```bash
git add filename
```

## 3. Commit Your Changes
This saves your staged changes to your local history with a message describing what you did.
```bash
git commit -m "Write a short description of your changes here"
```
*Example:* `git commit -m "Fix connection indicator bug"`

## 4. Push to GitHub
Finally, upload your local commits to the GitHub server.
```bash
git push
```

---

## Quick Summary (The Standard Workflow)
Run these three commands in order:

1. `git add .`
2. `git commit -m "Your message"`
3. `git push`
