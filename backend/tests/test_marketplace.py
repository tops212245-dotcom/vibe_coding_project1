import pytest
import secrets
from app.api.v1.categories import list_categories, get_category_by_slug, create_category, create_subcategory
from app.api.v1.services import list_services
from app.schemas.catalog import CategoryCreateRequest, SubcategoryCreateRequest

def test_list_master_categories(db):
    cats = list_categories(include_inactive=False, db=db)
    assert len(cats) >= 8
    slugs = [c.slug for c in cats]
    assert "electrical-services" in slugs
    assert "plumbing-services" in slugs
    assert "ac-repair-maintenance" in slugs

def test_get_category_by_slug(db):
    cat = get_category_by_slug(slug="electrical-services", db=db)
    assert cat.name == "Electrical Services"
    assert len(cat.subcategories) >= 1

def test_services_catalog_search(db):
    items = list_services(search="fan", db=db)
    assert len(items) >= 1
    assert any("Fan" in s.name for s in items)

def test_admin_category_and_subcategory_creation(db, admin_user):
    uid = secrets.token_hex(2)
    cat_payload = CategoryCreateRequest(
        name=f"Home Robotics {uid}",
        slug=f"home-robotics-{uid}",
        description="Vacuum and lawn robotics maintenance",
        icon="Bot",
        sort_order=10
    )
    new_cat = create_category(payload=cat_payload, db=db, admin=admin_user)
    assert new_cat.id is not None
    assert f"Home Robotics {uid}" in new_cat.name

    sub_payload = SubcategoryCreateRequest(
        category_id=new_cat.id,
        name=f"Robotic Vacuum Servicing {uid}",
        slug=f"robotic-vacuum-servicing-{uid}",
        description="Filter and sensor diagnostics"
    )
    new_sub = create_subcategory(payload=sub_payload, db=db, admin=admin_user)
    assert new_sub.id is not None
    assert f"Robotic Vacuum Servicing {uid}" in new_sub.name
