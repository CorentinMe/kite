package model

type EnvironmentType struct {
	Model
	Name  string `json:"name" gorm:"type:varchar(50);uniqueIndex;not null"`
	Color string `json:"color" gorm:"type:varchar(20);not null;default:'blue'"`
}

func CreateEnvironmentType(envType *EnvironmentType) error {
	return DB.Create(envType).Error
}

func GetEnvironmentTypeByName(name string) (*EnvironmentType, error) {
	var envType EnvironmentType
	if err := DB.Where("name = ?", name).First(&envType).Error; err != nil {
		return nil, err
	}
	return &envType, nil
}

func GetEnvironmentTypeByID(id uint) (*EnvironmentType, error) {
	var envType EnvironmentType
	if err := DB.First(&envType, id).Error; err != nil {
		return nil, err
	}
	return &envType, nil
}

func UpdateEnvironmentType(envType *EnvironmentType, updates map[string]interface{}) error {
	return DB.Model(envType).Updates(updates).Error
}

func DeleteEnvironmentType(envType *EnvironmentType) error {
	return DB.Delete(envType).Error
}

func ListEnvironmentTypes() ([]*EnvironmentType, error) {
	var envTypes []*EnvironmentType
	if err := DB.Order("id asc").Find(&envTypes).Error; err != nil {
		return nil, err
	}
	return envTypes, nil
}

func CountClustersByEnvironment(environment string) (int64, error) {
	var count int64
	return count, DB.Model(&Cluster{}).Where("environment = ?", environment).Count(&count).Error
}
