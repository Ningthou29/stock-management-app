from supabase import create_client, Client
from .config import settings

if not settings.supabase_url or "your-project-id" in settings.supabase_url:
    print("\n" + "="*80)
    print("WARNING: SUPABASE_URL and SUPABASE_KEY are not configured correctly in .env.")
    print("Please set them up to connect to your Supabase instance.")
    print("="*80 + "\n")

supabase: Client = create_client(settings.supabase_url, settings.supabase_key)
