REVOKE ALL ON FUNCTION public.is_conversation_member(uuid, uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.bump_conversation_activity() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.start_dm(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.create_group(text, uuid[], text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.start_dm(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_group(text, uuid[], text) TO authenticated;