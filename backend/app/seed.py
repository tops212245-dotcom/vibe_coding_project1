import logging
from sqlalchemy.orm import Session
from app.core.config import settings
from app.core.security import get_password_hash
from app.models.user import User, Customer, ServiceProvider, Technician, Address, UserRole, UserStatus, VerificationStatus
from app.models.catalog import ServiceCategory, ServiceSubcategory, Service, ProviderService, ServiceArea
from app.models.booking import ProviderWorkingHour
from app.models.finance import Coupon, DiscountType
from datetime import time, datetime, timedelta, timezone

logger = logging.getLogger("homeserve.seed")


def seed_database(db: Session) -> None:
    """Bootstrap admin account and initial marketplace catalog."""
    # 1. Bootstrap Admin
    admin_user = db.query(User).filter(User.role == UserRole.ADMIN).first()
    if not admin_user:
        admin_user = User(
            email=settings.FIRST_SUPERADMIN_EMAIL,
            hashed_password=get_password_hash(settings.FIRST_SUPERADMIN_PASSWORD),
            role=UserRole.ADMIN,
            first_name=settings.FIRST_SUPERADMIN_FIRSTNAME,
            last_name=settings.FIRST_SUPERADMIN_LASTNAME,
            phone="+919876543210",
            status=UserStatus.ACTIVE,
            is_verified=True,
        )
        db.add(admin_user)
        db.commit()
        db.refresh(admin_user)
        logger.info(f"Bootstrap Super Admin created: {admin_user.email}")

    # 2. Seed Master Categories if empty
    if db.query(ServiceCategory).count() == 0:
        categories_data = [
            {
                "name": "Electrical Services",
                "slug": "electrical-services",
                "description": "Wiring, appliance fittings, fuse repairs, switchboard installations by certified electricians.",
                "icon": "Zap",
                "sort_order": 1,
                "subcategories": [
                    {
                        "name": "Wiring & Switches",
                        "slug": "wiring-switches",
                        "services": [
                            {"name": "Switch & Socket Installation", "slug": "switch-socket-installation", "base_price": 199.00, "duration": 45, "description": "Professional installation or replacement of modular switch boards."},
                            {"name": "Complete Home Rewiring", "slug": "complete-home-rewiring", "base_price": 2499.00, "duration": 180, "description": "Safe, certified conduit electrical rewiring for apartments and villas."},
                        ]
                    },
                    {
                        "name": "Lighting Fixtures",
                        "slug": "lighting-fixtures",
                        "services": [
                            {"name": "Ceiling Fan Installation & Repair", "slug": "ceiling-fan-installation", "base_price": 299.00, "duration": 45, "description": "Mounting, balance checking, and motor capacitor replacement."},
                            {"name": "Chandelier & Decorative Light Mounting", "slug": "chandelier-mounting", "base_price": 799.00, "duration": 90, "description": "Precise structural mounting for chandeliers and track lights."},
                        ]
                    }
                ]
            },
            {
                "name": "Plumbing Services",
                "slug": "plumbing-services",
                "description": "Leak repairs, pipe installations, drain unblocking, and sanitary fixture setups.",
                "icon": "Wrench",
                "sort_order": 2,
                "subcategories": [
                    {
                        "name": "Pipe & Tap Repairs",
                        "slug": "pipe-tap-repairs",
                        "services": [
                            {"name": "Tap & Mixer Repair / Replacement", "slug": "tap-mixer-repair", "base_price": 249.00, "duration": 40, "description": "Fix dripping taps, pressure issues, and cartridge replacements."},
                            {"name": "Concealed Pipe Leakage Detection", "slug": "concealed-pipe-leakage", "base_price": 899.00, "duration": 90, "description": "Acoustic and thermal detection of pipeline seepages."},
                        ]
                    },
                    {
                        "name": "Drainage & Blockage",
                        "slug": "drainage-blockage",
                        "services": [
                            {"name": "Kitchen Sink & Basin Unclogging", "slug": "sink-unclogging", "base_price": 349.00, "duration": 60, "description": "Mechanical rodding and eco-friendly enzymatic drain clear."},
                        ]
                    }
                ]
            },
            {
                "name": "AC Repair and Maintenance",
                "slug": "ac-repair-maintenance",
                "description": "Deep jet cleaning, gas charging, compressor repairs, and seasonal servicing.",
                "icon": "Wind",
                "sort_order": 3,
                "subcategories": [
                    {
                        "name": "Service & Cleaning",
                        "slug": "ac-service-cleaning",
                        "services": [
                            {"name": "Split AC Jet Service", "slug": "split-ac-jet-service", "base_price": 599.00, "duration": 60, "description": "High-pressure foam jet cleaning for indoor coils and outdoor units."},
                            {"name": "Window AC Deep Cleaning", "slug": "window-ac-deep-cleaning", "base_price": 499.00, "duration": 60, "description": "Thorough chemical wash of filters, coils and blower wheel."},
                        ]
                    },
                    {
                        "name": "Repairs & Gas Refill",
                        "slug": "ac-repairs-gas",
                        "services": [
                            {"name": "Freon Gas Leak Check & Refill", "slug": "freon-gas-refill", "base_price": 1899.00, "duration": 90, "description": "Pressure vacuum test and genuine R32/R410A refrigerant charge."},
                        ]
                    }
                ]
            },
            {
                "name": "Home Cleaning",
                "slug": "home-cleaning",
                "description": "Full home deep cleaning, kitchen sanitization, sofa shampooing, and bathroom scrub.",
                "icon": "Sparkles",
                "sort_order": 4,
                "subcategories": [
                    {
                        "name": "Full House Cleaning",
                        "slug": "full-house-cleaning",
                        "services": [
                            {"name": "2 BHK Full Home Deep Cleaning", "slug": "2bhk-deep-cleaning", "base_price": 2899.00, "duration": 240, "description": "Complete floor buffing, window panes, balcony and dusting."},
                            {"name": "3 BHK Luxury Sanitization Clean", "slug": "3bhk-luxury-clean", "base_price": 3999.00, "duration": 300, "description": "Hospital grade sanitization and mechanized scrubbing."},
                        ]
                    },
                    {
                        "name": "Targeted Deep Clean",
                        "slug": "targeted-deep-clean",
                        "services": [
                            {"name": "Intensive Kitchen Oil De-greasing", "slug": "kitchen-degreasing", "base_price": 1199.00, "duration": 120, "description": "Degrease chimneys, tiles, slab, and cabinet exteriors."},
                        ]
                    }
                ]
            },
            {
                "name": "Painting Services",
                "slug": "painting-services",
                "description": "Interior emulsions, exterior weather coating, waterproofing, and accent texture walls.",
                "icon": "Paintbrush",
                "sort_order": 5,
                "subcategories": [
                    {
                        "name": "Interior Painting",
                        "slug": "interior-painting",
                        "services": [
                            {"name": "Single Room Repaint", "slug": "single-room-repaint", "base_price": 3499.00, "duration": 360, "description": "2 coats premium acrylic emulsion with masking and putty touch-ups."},
                            {"name": "Feature Accent Wall Design", "slug": "feature-accent-wall", "base_price": 2499.00, "duration": 180, "description": "Designer metallic stencil and texture wall creation."},
                        ]
                    }
                ]
            },
            {
                "name": "Carpentry Services",
                "slug": "carpentry-services",
                "description": "Custom furniture assembly, lock replacements, door hinges, and wooden polish.",
                "icon": "Hammer",
                "sort_order": 6,
                "subcategories": [
                    {
                        "name": "Furniture & Fittings",
                        "slug": "furniture-fittings",
                        "services": [
                            {"name": "Bed & Wardrobe Assembly", "slug": "bed-wardrobe-assembly", "base_price": 699.00, "duration": 90, "description": "Flatpack and custom furniture alignment and bolt fastening."},
                            {"name": "Door Lock & Handle Replacement", "slug": "door-lock-replacement", "base_price": 399.00, "duration": 60, "description": "Precision mortise and digital lock fitting."},
                        ]
                    }
                ]
            },
            {
                "name": "Appliance Repair",
                "slug": "appliance-repair",
                "description": "Washing machine, refrigerator, microwave oven, and water purifier servicing.",
                "icon": "Tv",
                "sort_order": 7,
                "subcategories": [
                    {
                        "name": "Major Appliances",
                        "slug": "major-appliances",
                        "services": [
                            {"name": "Washing Machine Motor & Drum Repair", "slug": "washing-machine-repair", "base_price": 499.00, "duration": 75, "description": "Troubleshoot drain errors, spin failure, and PCB board faults."},
                            {"name": "Double Door Refrigerator Cooling Repair", "slug": "fridge-cooling-repair", "base_price": 549.00, "duration": 80, "description": "Thermostat, defrost heater, and relay diagnosis."},
                        ]
                    }
                ]
            },
            {
                "name": "Pest Control",
                "slug": "pest-control",
                "description": "Odorless cockroach herbal gel, anti-termite piping treatment, and rodent control.",
                "icon": "ShieldAlert",
                "sort_order": 8,
                "subcategories": [
                    {
                        "name": "Pest Management",
                        "slug": "pest-management",
                        "services": [
                            {"name": "Cockroach & Ant Herbal Gel Treatment", "slug": "cockroach-herbal-gel", "base_price": 899.00, "duration": 60, "description": "100% odorless Bayer herbal gel with 90-day warranty."},
                            {"name": "Termite Drilling & Injection Drill", "slug": "termite-drilling-treatment", "base_price": 2199.00, "duration": 150, "description": "Sub-floor chemical barrier to prevent wood infestation."},
                        ]
                    }
                ]
            }
        ]

        for cat_info in categories_data:
            cat = ServiceCategory(
                name=cat_info["name"],
                slug=cat_info["slug"],
                description=cat_info["description"],
                icon=cat_info["icon"],
                sort_order=cat_info["sort_order"],
                is_active=True,
            )
            db.add(cat)
            db.flush()

            for sub_info in cat_info["subcategories"]:
                sub = ServiceSubcategory(
                    category_id=cat.id,
                    name=sub_info["name"],
                    slug=sub_info["slug"],
                    description=sub_info.get("description", ""),
                    is_active=True,
                )
                db.add(sub)
                db.flush()

                for srv_info in sub_info["services"]:
                    srv = Service(
                        subcategory_id=sub.id,
                        name=srv_info["name"],
                        slug=srv_info["slug"],
                        base_price=srv_info["base_price"],
                        estimated_duration_min=srv_info["duration"],
                        description=srv_info["description"],
                        is_active=True,
                    )
                    db.add(srv)
        db.commit()
        logger.info("Master categories and services seeded successfully.")

    # 3. Seed Demo Users for Customer, Provider, and Technician for instant out-of-the-box verification
    demo_provider_user = db.query(User).filter(User.email == "provider@homeserve.com").first()
    if not demo_provider_user:
        # Create Provider User
        demo_provider_user = User(
            email="provider@homeserve.com",
            hashed_password=get_password_hash("Provider123!"),
            role=UserRole.PROVIDER,
            first_name="Rajesh",
            last_name="Sharma",
            phone="+919811122233",
            status=UserStatus.ACTIVE,
            is_verified=True,
        )
        db.add(demo_provider_user)
        db.flush()

        provider_profile = ServiceProvider(
            user_id=demo_provider_user.id,
            business_name="Apex Home Solutions",
            business_reg_no="REG-2024-MH-8902",
            tax_id="GSTIN27AAACH1234F1Z5",
            bio="Certified professional home maintenance group with over 8 years experience serving 5,000+ satisfied residential clients.",
            experience_years=8,
            verification_status=VerificationStatus.APPROVED,
            verification_notes="Verified government trade license and ID documents.",
            average_rating=4.9,
            total_reviews=142,
            commission_rate=10.00,
        )
        db.add(provider_profile)
        db.flush()

        # Add Provider Coverage Area
        db.add(ServiceArea(provider_id=provider_profile.id, postal_code="400001", city="Mumbai"))
        db.add(ServiceArea(provider_id=provider_profile.id, postal_code="400050", city="Mumbai"))
        db.add(ServiceArea(provider_id=provider_profile.id, postal_code="560001", city="Bangalore"))

        # Add Working Hours (Monday to Saturday, 9 AM to 7 PM)
        for d in range(6):  # 0 to 5
            db.add(ProviderWorkingHour(
                provider_id=provider_profile.id,
                day_of_week=d,
                start_time=time(9, 0),
                end_time=time(19, 0),
                is_closed=False
            ))
        # Sunday closed
        db.add(ProviderWorkingHour(
            provider_id=provider_profile.id,
            day_of_week=6,
            start_time=time(9, 0),
            end_time=time(13, 0),
            is_closed=True
        ))

        # Attach sample provider services
        sample_services = db.query(Service).limit(6).all()
        for s in sample_services:
            db.add(ProviderService(
                provider_id=provider_profile.id,
                service_id=s.id,
                custom_price=s.base_price,
                duration_min=s.estimated_duration_min,
                is_available=True,
                description=f"Standard certified service delivered with guaranteed 30-day warranty."
            ))

        # Create Technician for this provider
        tech_user = User(
            email="tech@homeserve.com",
            hashed_password=get_password_hash("Tech123!"),
            role=UserRole.TECHNICIAN,
            first_name="Amit",
            last_name="Verma",
            phone="+919822233344",
            status=UserStatus.ACTIVE,
            is_verified=True,
        )
        db.add(tech_user)
        db.flush()

        tech_profile = Technician(
            user_id=tech_user.id,
            provider_id=provider_profile.id,
            specialization="Master Electrician & AC Specialist",
            is_available=True,
            rating=4.95,
            total_jobs=84,
        )
        db.add(tech_profile)

        # Create Demo Customer
        cust_user = User(
            email="customer@homeserve.com",
            hashed_password=get_password_hash("Customer123!"),
            role=UserRole.CUSTOMER,
            first_name="Priya",
            last_name="Patel",
            phone="+919833344455",
            status=UserStatus.ACTIVE,
            is_verified=True,
        )
        db.add(cust_user)
        db.flush()

        cust_profile = Customer(user_id=cust_user.id)
        db.add(cust_profile)
        db.flush()

        # Add Demo Address for Customer
        addr = Address(
            user_id=cust_user.id,
            title="Apartment",
            address_line1="B-402, Green Meadows Residency",
            address_line2="Near Palm Beach Road, Sector 14",
            city="Mumbai",
            state="Maharashtra",
            postal_code="400050",
            country="India",
            is_default=True,
        )
        db.add(addr)

        # Add Promo Coupon
        coupon = Coupon(
            code="WELCOME50",
            discount_type=DiscountType.PERCENTAGE,
            discount_value=15.00,
            min_order_amount=299.00,
            max_discount_amount=200.00,
            valid_from=datetime.now(timezone.utc) - timedelta(days=1),
            valid_until=datetime.now(timezone.utc) + timedelta(days=365),
            usage_limit=1000,
            is_active=True,
        )
        db.add(coupon)

        db.commit()
        logger.info("Demo provider, technician, customer, address, and coupon seeded successfully.")

