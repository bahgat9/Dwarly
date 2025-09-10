# TODO for Fixing Join Button Status Update

- [x] Edit `client/src/pages/Academies.jsx` in `submitJoin` function: Add `loadRequestStatus()` call after `setRequestStatus('pending')` to ensure immediate status update from server.
- [x] Test the join functionality to confirm button changes to "Pending" after sending request.
- [ ] Verify polling updates status to "approved" or "rejected" when academy responds.
