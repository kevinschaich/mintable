enum PropertyType {
    Automated = 'automated',
    Manual = 'manual'
}

export interface BaseProperty {
    id: string
    name: string
    type: PropertyType
}
