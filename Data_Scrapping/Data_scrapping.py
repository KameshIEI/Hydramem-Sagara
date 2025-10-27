import os
import re
import pandas as pd

# -----------------------------
# Helper: Excel cell -> index
# -----------------------------
def cell_to_index(cell_ref):
    if not cell_ref:
        return None, None
    m = re.match(r"^([A-Za-z]+)(\d+)$", str(cell_ref).strip())
    if not m:
        return None, None
    col_letters, row_num = m.group(1).upper(), int(m.group(2))
    col_num = 0
    for ch in col_letters:
        col_num = col_num * 26 + (ord(ch) - ord("A") + 1)
    return row_num - 1, col_num - 1


# Stage 1 mapping
MAPPING_STAGE1 = [
    ("Results Summary", "C5", "Feed Flow (m3/hr)"),
    ("Process Data", "E34", "Feed Pressure(bar)"),
    ("Results Summary", "D10", "Feed Temperature"),
    ("Results Summary", "C41", "Feed water pH"),
    (None, None, "Specific Energy(kwh/m3)"),
    ("Results Summary", "B14", "Flux(lmh)"),
    ("Results Summary", "A23", "Pass Stage"),
    ("Results Summary", "B24", "Pressure Vessel"),
    ("Input Data Summary", "C44", "Elements"),
    ("Input Data Summary", "E44", "Element age(years)"),
    ("Results Summary", "B19", "Recovery(%)"),

    ("Results Summary", "C31", "Ca_FW"),
    ("Results Summary", "C32", "Mg_FW"),
    ("Results Summary", "C33", "Na_FW"),
    ("Results Summary", "C34", "K_FW"),
    ("Results Summary", "C35", "NH4_FW"),
    ("Results Summary", "C36", "Ba_FW"),
    ("Results Summary", "C37", "Sr_FW"),
    ("Results Summary", "H39", "H_FW"),
    ("Results Summary", "H42", "CO3_FW"),
    ("Results Summary", "H40", "HCO3_FW"),
    ("Results Summary", "H31", "SO4_FW"),
    ("Results Summary", "H32", "Cl_FW"),
    ("Results Summary", "H33", "F_FW"),
    ("Results Summary", "H34", "NO3_FW"),
    ("Results Summary", "H36", "PO4_FW"),
    (None, None, "OH_FW"),
    ("Results Summary", "H38", "SiO2_FW"),
    ("Results Summary", "H37", "B_FW"),
    ("Results Summary", "H41", "CO2_FW"),
    (None, None, "NH3_FW"),
    ("Results Summary", "C40", "Feed Water TDS"),
    ("Results Summary", "C45", "CaSO4 / ksp * 100, %_FW"),
    ("Results Summary", "C46", "SrSO4 / ksp * 100, %_FW"),
    ("Results Summary", "C44", "BaSO4 / ksp * 100, %_FW"),
    ("Results Summary", "H45", "SiO2 saturation, %_FW"),
    ("Results Summary", "H44", "CaF2 / ksp * 100, %_FW"),

    ("Results Summary", "B31", "Ca_P"),
    ("Results Summary", "B32", "Mg_P"),
    ("Results Summary", "B33", "Na_P"),
    ("Results Summary", "B34", "K_P"),
    ("Results Summary", "B35", "NH4_P"),
    ("Results Summary", "B36", "Ba_P"),
    ("Results Summary", "B37", "Sr_P"),
    ("Results Summary", "G39", "H_P"),
    ("Results Summary", "G42", "CO3_P"),
    ("Results Summary", "G40", "HCO3_P"),
    ("Results Summary", "G31", "SO4_P"),
    ("Results Summary", "G32", "Cl_P"),
    ("Results Summary", "G33", "F_P"),
    ("Results Summary", "G34", "NO3_P"),
    ("Results Summary", "G36", "PO4_P"),
    (None, None, "OH_P"),
    ("Results Summary", "G38", "SiO2_P"),
    ("Results Summary", "G37", "B_P"),
    ("Results Summary", "G41", "CO2_P"),
    (None, None, "NH3_P"),
    ("Results Summary", "B40", "Permeate TDS"),

    ("Results Summary", "D31", "Ca_C"),
    ("Results Summary", "D32", "Mg_C"),
    ("Results Summary", "D33", "Na_C"),
    ("Results Summary", "D34", "K_C"),
    ("Results Summary", "D35", "NH4_C"),
    ("Results Summary", "D36", "Ba_C"),
    ("Results Summary", "D37", "Sr_C"),
    ("Results Summary", "I39", "H_C"),
    ("Results Summary", "I42", "CO3_C"),
    ("Results Summary", "I40", "HCO3_C"),
    ("Results Summary", "I31", "SO4_C"),
    ("Results Summary", "I32", "Cl_C"),
    ("Results Summary", "I33", "F_C"),
    ("Results Summary", "I34", "NO3_C"),
    ("Results Summary", "I36", "PO4_C"),
    (None, None, "OH_C"),
    ("Results Summary", "I38", "SiO2_C"),
    ("Results Summary", "I37", "B_C"),
    ("Results Summary", "I41", "CO2_C"),
    (None, None, "NH3_C"),
    ("Results Summary", "D40", "Concentrate TDS"),
    ("Results Summary", "D45", "CaSO4 / ksp * 100, %_C"),
    ("Results Summary", "D46", "SrSO4 / ksp * 100, %_C"),
    ("Results Summary", "D44", "BaSO4 / ksp * 100, %_C"),
    ("Results Summary", "I45", "SiO2 saturation, %_C"),
    ("Results Summary", "I44", "CaF2 / ksp * 100, %_C"),    
]

# Stage 2 mapping (different cells/columns)
MAPPING_STAGE2 = [
    ("Results Summary", "C5", "Feed Flow (m3/hr)"),
    ("Process Data", "E34", "Feed Pressure(bar)"),
    ("Results Summary", "D10", "Feed Temperature"),
    ("Results Summary", "C42", "Feed water pH"),
    (None, None, "Specific Energy(kwh/m3)"),
    ("Results Summary", "B14", "Flux(lmh)"),
    ("Results Summary", "A23", "Pass Stage"),
    ("Results Summary", "B25", "Pressure Vessel"),
    ("Input Data Summary", "C44", "Elements"),
    ("Input Data Summary", "E44", "Element age(years)"),
    ("Results Summary", "B19", "Recovery(%)"),

    ("Results Summary", "C32", "Ca_FW"),
    ("Results Summary", "C33", "Mg_FW"),
    ("Results Summary", "C34", "Na_FW"),
    ("Results Summary", "C35", "K_FW"),
    ("Results Summary", "C36", "NH4_FW"),
    ("Results Summary", "C37", "Ba_FW"),
    ("Results Summary", "C38", "Sr_FW"),
    ("Results Summary", "H40", "H_FW"),
    ("Results Summary", "H43", "CO3_FW"),
    ("Results Summary", "H41", "HCO3_FW"),
    ("Results Summary", "H32", "SO4_FW"),
    ("Results Summary", "H33", "Cl_FW"),
    ("Results Summary", "H34", "F_FW"),
    ("Results Summary", "H35", "NO3_FW"),
    ("Results Summary", "H37", "PO4_FW"),
    (None, None, "OH_FW"),
    ("Results Summary", "H39", "SiO2_FW"),
    ("Results Summary", "H38", "B_FW"),
    ("Results Summary", "H42", "CO2_FW"),
    (None, None, "NH3_FW"),
    ("Results Summary", "C41", "Feed Water TDS"),
    ("Results Summary", "C46", "CaSO4 / ksp * 100, %_FW"),
    ("Results Summary", "C47", "SrSO4 / ksp * 100, %_FW"),
    ("Results Summary", "C45", "BaSO4 / ksp * 100, %_FW"),
    ("Results Summary", "H46", "SiO2 saturation, %_FW"),
    ("Results Summary", "H45", "CaF2 / ksp * 100, %_FW"),

    ("Results Summary", "B32", "Ca_P"),
    ("Results Summary", "B33", "Mg_P"),
    ("Results Summary", "B34", "Na_P"),
    ("Results Summary", "B35", "K_P"),
    ("Results Summary", "B36", "NH4_P"),
    ("Results Summary", "B37", "Ba_P"),
    ("Results Summary", "B38", "Sr_P"),
    ("Results Summary", "G40", "H_P"),
    ("Results Summary", "G43", "CO3_P"),
    ("Results Summary", "G41", "HCO3_P"),
    ("Results Summary", "G32", "SO4_P"),
    ("Results Summary", "G33", "Cl_P"),
    ("Results Summary", "G34", "F_P"),
    ("Results Summary", "G35", "NO3_P"),
    ("Results Summary", "G37", "PO4_P"),
    (None, None, "OH_P"),
    ("Results Summary", "G39", "SiO2_P"),
    ("Results Summary", "G38", "B_P"),
    ("Results Summary", "G42", "CO2_P"),
    (None, None, "NH3_P"),
    ("Results Summary", "B41", "Permeate TDS"),

    ("Results Summary", "D32", "Ca_C"),
    ("Results Summary", "D33", "Mg_C"),
    ("Results Summary", "D34", "Na_C"),
    ("Results Summary", "D35", "K_C"),
    ("Results Summary", "D36", "NH4_C"),
    ("Results Summary", "D37", "Ba_C"),
    ("Results Summary", "D38", "Sr_C"),
    ("Results Summary", "I40", "H_C"),
    ("Results Summary", "I43", "CO3_C"),
    ("Results Summary", "I41", "HCO3_C"),
    ("Results Summary", "I32", "SO4_C"),
    ("Results Summary", "I33", "Cl_C"),
    ("Results Summary", "I34", "F_C"),
    ("Results Summary", "I35", "NO3_C"),
    ("Results Summary", "I37", "PO4_C"),
    (None, None, "OH_C"),
    ("Results Summary", "I39", "SiO2_C"),
    ("Results Summary", "I38", "B_C"),
    ("Results Summary", "I42", "CO2_C"),
    (None, None, "NH3_C"),
    ("Results Summary", "D41", "Concentrate TDS"),
    ("Results Summary", "D46", "CaSO4 / ksp * 100, %_C"),
    ("Results Summary", "D47", "SrSO4 / ksp * 100, %_C"),
    ("Results Summary", "D45", "BaSO4 / ksp * 100, %_C"),
    ("Results Summary", "I46", "SiO2 saturation, %_C"),
    ("Results Summary", "I45", "CaF2 / ksp * 100, %_C"),
]

# Stage 3 mapping (different cells/columns)
MAPPING_STAGE3 = [
    ("Results Summary", "C5", "Feed Flow (m3/hr)"),
    ("Process Data", "E34", "Feed Pressure(bar)"),
    ("Results Summary", "D10", "Feed Temperature"),
    ("Results Summary", "C43", "Feed water pH"),
    (None, None, "Specific Energy(kwh/m3)"),
    ("Results Summary", "B14", "Flux(lmh)"),
    ("Results Summary", "A23", "Pass Stage"),
    ("Results Summary", "B26", "Pressure Vessel"),
    ("Input Data Summary", "C44", "Elements"),
    ("Input Data Summary", "E44", "Element age(years)"),
    ("Results Summary", "B19", "Recovery(%)"),

    ("Results Summary", "C33", "Ca_FW"),
    ("Results Summary", "C34", "Mg_FW"),
    ("Results Summary", "C35", "Na_FW"),
    ("Results Summary", "C36", "K_FW"),
    ("Results Summary", "C37", "NH4_FW"),
    ("Results Summary", "C38", "Ba_FW"),
    ("Results Summary", "C39", "Sr_FW"),
    ("Results Summary", "H41", "H_FW"),
    ("Results Summary", "H44", "CO3_FW"),
    ("Results Summary", "H42", "HCO3_FW"),
    ("Results Summary", "H33", "SO4_FW"),
    ("Results Summary", "H34", "Cl_FW"),
    ("Results Summary", "H35", "F_FW"),
    ("Results Summary", "H36", "NO3_FW"),
    ("Results Summary", "H38", "PO4_FW"),
    (None, None, "OH_FW"),
    ("Results Summary", "H40", "SiO2_FW"),
    ("Results Summary", "H39", "B_FW"),
    ("Results Summary", "H43", "CO2_FW"),
    (None, None, "NH3_FW"),
    ("Results Summary", "C42", "Feed Water TDS"),
    ("Results Summary", "C47", "CaSO4 / ksp * 100, %_FW"),
    ("Results Summary", "C48", "SrSO4 / ksp * 100, %_FW"),
    ("Results Summary", "C46", "BaSO4 / ksp * 100, %_FW"),
    ("Results Summary", "H47", "SiO2 saturation, %_FW"),
    ("Results Summary", "H46", "CaF2 / ksp * 100, %_FW"),

    ("Results Summary", "B33", "Ca_P"),
    ("Results Summary", "B34", "Mg_P"),
    ("Results Summary", "B35", "Na_P"),
    ("Results Summary", "B36", "K_P"),
    ("Results Summary", "B37", "NH4_P"),
    ("Results Summary", "B38", "Ba_P"),
    ("Results Summary", "B39", "Sr_P"),
    ("Results Summary", "G41", "H_P"),
    ("Results Summary", "G44", "CO3_P"),
    ("Results Summary", "G42", "HCO3_P"),
    ("Results Summary", "G33", "SO4_P"),
    ("Results Summary", "G34", "Cl_P"),
    ("Results Summary", "G35", "F_P"),
    ("Results Summary", "G36", "NO3_P"),
    ("Results Summary", "G38", "PO4_P"),
    (None, None, "OH_P"),
    ("Results Summary", "G40", "SiO2_P"),
    ("Results Summary", "G39", "B_P"),
    ("Results Summary", "G43", "CO2_P"),
    (None, None, "NH3_P"),
    ("Results Summary", "B42", "Permeate TDS"),

    ("Results Summary", "D33", "Ca_C"),
    ("Results Summary", "D34", "Mg_C"),
    ("Results Summary", "D35", "Na_C"),
    ("Results Summary", "D36", "K_C"),
    ("Results Summary", "D37", "NH4_C"),
    ("Results Summary", "D38", "Ba_C"),
    ("Results Summary", "D39", "Sr_C"),
    ("Results Summary", "I41", "H_C"),
    ("Results Summary", "I44", "CO3_C"),
    ("Results Summary", "I42", "HCO3_C"),
    ("Results Summary", "I33", "SO4_C"),
    ("Results Summary", "I34", "Cl_C"),
    ("Results Summary", "I35", "F_C"),
    ("Results Summary", "I36", "NO3_C"),
    ("Results Summary", "I38", "PO4_C"),
    (None, None, "OH_C"),
    ("Results Summary", "I40", "SiO2_C"),
    ("Results Summary", "I39", "B_C"),
    ("Results Summary", "I43", "CO2_C"),
    (None, None, "NH3_C"),
    ("Results Summary", "D42", "Concentrate TDS"),
    ("Results Summary", "D47", "CaSO4 / ksp * 100, %_C"),
    ("Results Summary", "D48", "SrSO4 / ksp * 100, %_C"),
    ("Results Summary", "D46", "BaSO4 / ksp * 100, %_C"),
    ("Results Summary", "I47", "SiO2 saturation, %_C"),
    ("Results Summary", "I46", "CaF2 / ksp * 100, %_C"),
]


# -----------------------------
# Stage detection
# -----------------------------
def detect_stage_and_get_mapping(excel_path):
    """Check A25 (stage 3), A24 (stage 2), A23 (stage 1) and return mapping."""
    try:
        df = pd.read_excel(excel_path, sheet_name="Results Summary", header=None)
    except Exception:
        raise ValueError("❌ Could not open 'Results Summary' sheet for stage detection")

    # Stage 3
    r, c = cell_to_index("A25")
    try:
        if str(df.iat[r, c]).strip() == "3":
            print("✅ Stage 3 detected")
            return MAPPING_STAGE3
    except Exception:
        pass

    # Stage 2
    r, c = cell_to_index("A24")
    try:
        if str(df.iat[r, c]).strip() == "2":
            print("✅ Stage 2 detected")
            return MAPPING_STAGE2
    except Exception:
        pass

    # Stage 1
    r, c = cell_to_index("A23")
    try:
        if str(df.iat[r, c]).strip() == "1":
            print("✅ Stage 1 detected")
            return MAPPING_STAGE1
    except Exception:
        pass

    raise ValueError("❌ Stage not detected (A25 != 3, A24 != 2, A23 != 1)")


# -----------------------------
# Extract values from Excel
# -----------------------------
def extract_data_from_excel(excel_path, mapping):
    row_result = {col_name: "" for (_, _, col_name) in mapping}
    _, ext = os.path.splitext(excel_path)
    ext = ext.lower()

    for sheet_name, cell_ref, col_name in mapping:
        if col_name == "Specific Energy(kwh/m3)":
            # Special case handling for "Process Data" sheet
            try:
                if ext == ".xls":
                    df_proc = pd.read_excel(excel_path, sheet_name="Process Data", header=None, engine="xlrd")
                else:
                    df_proc = pd.read_excel(excel_path, sheet_name="Process Data", header=None)

                for check_row in [47, 53, 59]:
                    a_val = df_proc.iat[check_row - 1, 0] if check_row - 1 < df_proc.shape[0] else None
                    if str(a_val).strip() == "Total Power Consumption":
                        e_val = df_proc.iat[check_row - 1, 4] if check_row - 1 < df_proc.shape[0] else None
                        row_result[col_name] = "" if pd.isna(e_val) else e_val
                        break
            except Exception:
                row_result[col_name] = ""
            continue

        if cell_ref is None:
            row_result[col_name] = ""
            continue

        try:
            if ext == ".xls":
                df = pd.read_excel(excel_path, sheet_name=sheet_name, header=None, engine="xlrd")
            else:
                df = pd.read_excel(excel_path, sheet_name=sheet_name, header=None)
        except Exception:
            row_result[col_name] = ""
            continue

        r_idx, c_idx = cell_to_index(cell_ref)
        if r_idx is None or c_idx is None or r_idx >= df.shape[0] or c_idx >= df.shape[1]:
            row_result[col_name] = ""
            continue
        try:
            val = df.iat[r_idx, c_idx]
            row_result[col_name] = "" if pd.isna(val) else val
        except Exception:
            row_result[col_name] = ""
    return row_result


# -----------------------------
# Directory processing
# -----------------------------
def process_directory_and_update_csv(directory_path, master_csv_path):
    all_files = []
    for root, dirs, files in os.walk(directory_path):
        for file in files:
            if file.lower().endswith((".xls", ".xlsx")):
                all_files.append(os.path.join(root, file))

    # Build union of all column names from all mappings
    ALL_MAPPINGS = MAPPING_STAGE1 + MAPPING_STAGE2 + MAPPING_STAGE3
    COLUMN_ORDER = []
    for (_, _, col_name) in ALL_MAPPINGS:
        if col_name not in COLUMN_ORDER:
            COLUMN_ORDER.append(col_name)

    # Load existing master.csv if present
    if os.path.exists(master_csv_path):
        master_df = pd.read_csv(master_csv_path, dtype=object)
        for col in COLUMN_ORDER:
            if col not in master_df.columns:
                master_df[col] = ""
        other_cols = [c for c in master_df.columns if c not in COLUMN_ORDER]
        master_df = master_df[COLUMN_ORDER + other_cols]
    else:
        master_df = pd.DataFrame(columns=COLUMN_ORDER)

    # Process each file
    for file in sorted(all_files):
        print(f"\nProcessing: {file}")
        try:
            mapping = detect_stage_and_get_mapping(file)
        except ValueError as e:
            print(str(e))
            continue

        extracted = extract_data_from_excel(file, mapping)
        row_df = pd.DataFrame([extracted], columns=COLUMN_ORDER)
        master_df = pd.concat([master_df, row_df], ignore_index=True, sort=False)

    master_df.to_csv(master_csv_path, index=False)
    print(f"\n✅ Master CSV updated: {master_csv_path}")


# -----------------------------
# Main entry
# -----------------------------
if __name__ == "__main__":
    directory_path = r"C:\Users\101621\Desktop\Membrane Projects\Trained Data\Trained Data Entery Set 2 and Set 3\Complate project Set 2 and set 3"
    master_csv_path = r"master.csv"
    process_directory_and_update_csv(directory_path, master_csv_path)

