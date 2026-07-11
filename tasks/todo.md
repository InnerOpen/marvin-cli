# Task: Fix CRITICAL Security and Performance Issues in Marvin Backend

## Goal
Address 8 critical issues found in Marvin backend code review, including security vulnerabilities (dead route file, path traversal, unvalidated passwords), performance problems (N+1 queries), and functionality gaps (scheduled publishing). Success means all critical security holes are patched, N+1 queries are eliminated, and scheduled publishing is either implemented or properly documented as unavailable.

## Plan
- [ ] **Issue 1: Delete dead publish.py route file (SECURITY)**
  - Verify `/Volumes/Code/Marvin/src/marvin/routes/publish.py` is shadowed by package
  - Check all imports to confirm they reference the package, not the file
  - Delete the dead file
  - Test publishing endpoints still work

- [ ] **Issue 4: Add password confirmation validator (SECURITY)**
  - Read `/Volumes/Code/Marvin/src/marvin/schemas/user/password.py`
  - Add `@model_validator` to check password/passwordConfirm match
  - Test password reset flow with mismatched passwords

- [ ] **Issue 6: Add path traversal validation to file tokens (SECURITY)**
  - Locate `create_file_token` function
  - Add path validation logic (reject `..`, validate within allowed directories)
  - Test with various malicious paths

- [ ] **Issue 5: Fix silent date filter failures (DATA INTEGRITY)**
  - Find where `updated_since` parameter is parsed
  - Add try/except with proper 400 error response
  - Test with invalid date formats

- [ ] **Issue 2: Fix N+1 queries in publishing controller (PERFORMANCE)**
  - Read `/Volumes/Code/Marvin/src/marvin/routes/publish/publishing_controller.py`
  - Add `joinedload()` for Entry.assets, Entry.collections, Entry.resources, Entry.metadata
  - Enable SQLAlchemy query logging and verify query count reduction
  - Test that all relationships still load correctly

- [ ] **Issue 3: Implement or document scheduled publishing (FUNCTIONALITY)**
  - Read `/Volumes/Code/Marvin/src/marvin/services/scheduled_tasks/handlers/publishing.py`
  - Decide: implement or document as unavailable
  - If implementing: add logic for publish_at and expires_at handling
  - If documenting: disable tasks and update schemas

- [ ] **Issue 7: Fix deprecated datetime.utcnow() calls**
  - Find all `datetime.utcnow()` in publishing handlers
  - Replace with `datetime.now(UTC)`

- [ ] **Issue 8: Fix SQL text wrapping**
  - Find `session.execute("VACUUM")` or similar raw SQL
  - Wrap with `text()` function from sqlalchemy

- [ ] **Final verification**
  - Run existing test suite
  - Review all changes for regressions
  - Document all fixes and query count improvements

## Questions / Dependencies
- For scheduled publishing (Issue 3): Need to decide whether to implement or document as unavailable. This may require input on product priorities.
- Need to verify if there are existing tests for the affected modules, or if new tests need to be written.

## Results


## Lessons

