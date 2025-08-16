import os
import json
import pandas as pd
from collections import defaultdict
from statistics import mean
from datetime import datetime

# Key lab codes to extract for readmission risk prediction
LAB_CODES = {
    "29463-7": "Weight",
    "8302-2": "Height",
    "39156-5": "BMI",
    "8480-6": "SystolicBP",
    "8462-4": "DiastolicBP",
    "8867-4": "HeartRate",
    "9279-1": "RespRate",
    "8310-5": "Temperature",
    "2339-0": "Glucose",
    "4548-4": "HemoglobinA1C"
}

# Sample list of chronic/comorbid conditions (expand as needed)
CHRONIC_CONDITIONS = {
    "44054006": "Diabetes",
    "38341003": "Hypertension",
    "233604007": "COPD",
    "195967001": "Asthma",
    "55822004": "Depression",
    "25064002": "Heart Failure"
}

def calculate_age(birthdate_str):
    try:
        birthdate = datetime.strptime(birthdate_str, "%Y-%m-%d")
        today = datetime.today()
        return today.year - birthdate.year - ((today.month, today.day) < (birthdate.month, birthdate.day))
    except:
        return None

def extract_fhir_data(folder_path):
    print("🔍 Scanning folder:", folder_path)

    patients = defaultdict(lambda: {
        "patient_id": None,
        "gender": None,
        "birthDate": None,
        "age": None,
        "city": None,
        "num_conditions": 0,
        "chronic_conditions": set(),
        "num_encounters": 0,
        "readmission_count": 0,
        "lengths_of_stay": [],
        "lab_results": defaultdict(list)
    })

    for filename in os.listdir(folder_path):
        if not filename.endswith(".json"):
            continue
        filepath = os.path.join(folder_path, filename)
        if not os.path.isfile(filepath):
            continue

        print(f"📄 Processing file: {filename}")
        try:
            with open(filepath) as f:
                content = json.load(f)
                for entry in content.get("entry", []):
                    resource = entry.get("resource", {})
                    rtype = resource.get("resourceType")

                    if rtype == "Patient":
                        pid = resource.get("id")
                        birthDate = resource.get("birthDate")
                        patients[pid].update({
                            "patient_id": pid,
                            "gender": resource.get("gender"),
                            "birthDate": birthDate,
                            "age": calculate_age(birthDate),
                            "city": resource.get("address", [{}])[0].get("city")
                        })

                    elif rtype == "Condition":
                        pid = resource.get("subject", {}).get("reference", "").split("/")[-1]
                        code = resource.get("code", {}).get("coding", [{}])[0].get("code")
                        patients[pid]["num_conditions"] += 1
                        if code in CHRONIC_CONDITIONS:
                            patients[pid]["chronic_conditions"].add(CHRONIC_CONDITIONS[code])

                    elif rtype == "Encounter":
                        pid = resource.get("subject", {}).get("reference", "").split("/")[-1]
                        start = resource.get("period", {}).get("start")
                        end = resource.get("period", {}).get("end")
                        patients[pid]["num_encounters"] += 1

                        if start and end:
                            try:
                                d1 = datetime.fromisoformat(start)
                                d2 = datetime.fromisoformat(end)
                                stay_length = (d2 - d1).days
                                patients[pid]["lengths_of_stay"].append(stay_length)
                            except:
                                pass

                    elif rtype == "Observation":
                        pid = resource.get("subject", {}).get("reference", "").split("/")[-1] if "subject" in resource else None
                        code = resource.get("code", {}).get("coding", [{}])[0].get("code")
                        val = resource.get("valueQuantity", {}).get("value")
                        if code in LAB_CODES and val is not None:
                            patients[pid]["lab_results"][code].append(val)
        except Exception as e:
            print(f"❌ Error reading {filename}: {e}")

    records = []
    for pid, data in patients.items():
        row = {
            "patient_id": data["patient_id"],
            "gender": data["gender"],
            "birthDate": data["birthDate"],
            "age": data["age"],
            "city": data["city"],
            "num_conditions": data["num_conditions"],
            "num_encounters": data["num_encounters"],
            "avg_length_of_stay": mean(data["lengths_of_stay"]) if data["lengths_of_stay"] else None,
            "chronic_conditions": "; ".join(sorted(data["chronic_conditions"])) if data["chronic_conditions"] else None
        }
        for code, values in data["lab_results"].items():
            label = LAB_CODES[code]
            row[f"{label}_min"] = min(values)
            row[f"{label}_max"] = max(values)
            row[f"{label}_avg"] = mean(values)

        records.append(row)

    df = pd.DataFrame(records)
    output_csv = os.path.join(folder_path, "readmission_ready_dataset.csv")
    df.to_csv(output_csv, index=False)
    print(f"✅ Extracted dataset saved to {output_csv}")

if __name__ == "__main__":
    folder = os.path.dirname(os.path.abspath(__file__))
    extract_fhir_data(folder)

